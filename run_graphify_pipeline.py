import sys
import json
from pathlib import Path
from datetime import datetime, timezone
from graphify.detect import detect, save_manifest
from graphify.extract import collect_files, extract
from graphify.build import build_from_json
from graphify.cluster import cluster, score_all
from graphify.analyze import god_nodes, surprising_connections, suggest_questions
from graphify.report import generate
from graphify.export import to_json, to_html
from graphify.diagnostics import diagnose_extraction, format_diagnostic_report

def main():
    root = Path('.').resolve()
    out_dir = root / 'graphify-out'
    out_dir.mkdir(exist_ok=True)

    print(f"[graphify] Running pipeline on {root}")

    # 1. Detect
    detection = detect(root)
    (out_dir / '.graphify_detect.json').write_text(json.dumps(detection, indent=2, ensure_ascii=False), encoding='utf-8')
    (out_dir / '.graphify_python').write_text(sys.executable, encoding='utf-8')
    (out_dir / '.graphify_root').write_text(str(root), encoding='utf-8')

    code_files_raw = detection.get('files', {}).get('code', [])
    print(f"[graphify] Detected {detection.get('total_files', 0)} files ({len(code_files_raw)} code files)")

    # 2. Part A: AST Extraction
    code_files = []
    for f in code_files_raw:
        p = Path(f)
        # Exclude third-party vendor bundles, generated build artifacts, and screenshots
        if {'libs', 'node_modules', 'dist', 'screenshots'} & set(p.parts):
            continue
        code_files.extend(collect_files(p) if p.is_dir() else [p])

    if code_files:
        ast_result = extract(code_files, cache_root=root)
        (out_dir / '.graphify_ast.json').write_text(json.dumps(ast_result, indent=2, ensure_ascii=False), encoding='utf-8')
        print(f"[graphify] AST Extraction: {len(ast_result['nodes'])} nodes, {len(ast_result['edges'])} edges")
    else:
        ast_result = {'nodes': [], 'edges': [], 'input_tokens': 0, 'output_tokens': 0}
        (out_dir / '.graphify_ast.json').write_text(json.dumps(ast_result, ensure_ascii=False), encoding='utf-8')

    # 3. Part B: Semantic Extraction (Empty fast-path for code AST)
    sem_result = {'nodes': [], 'edges': [], 'hyperedges': [], 'input_tokens': 0, 'output_tokens': 0}
    (out_dir / '.graphify_semantic.json').write_text(json.dumps(sem_result, ensure_ascii=False), encoding='utf-8')

    # 4. Part C: Merge
    merged_nodes = list(ast_result['nodes'])
    merged_edges = list(ast_result['edges'])
    merged_extract = {
        'nodes': merged_nodes,
        'edges': merged_edges,
        'hyperedges': [],
        'input_tokens': 0,
        'output_tokens': 0
    }
    (out_dir / '.graphify_extract.json').write_text(json.dumps(merged_extract, indent=2, ensure_ascii=False), encoding='utf-8')

    # 5. Graph Health Check
    health_summary = diagnose_extraction(merged_extract, directed=False, root=str(root))
    print("[graphify] Health Check:")
    print(format_diagnostic_report(health_summary))

    # 6. Build & Cluster Graph
    G = build_from_json(merged_extract, root=str(root), directed=False)
    if G.number_of_nodes() == 0:
        print("[graphify] ERROR: Graph has 0 nodes.")
        sys.exit(1)

    communities = cluster(G)
    cohesion = score_all(G, communities)
    gods = god_nodes(G)
    surprises = surprising_connections(G, communities)

    # 7. Label Communities Intelligently
    labels = {}
    for cid, nodes in communities.items():
        node_str = " ".join([str(n).lower() for n in nodes])
        if any(k in node_str for k in ['gamestate', 'eventbus', 'telemetry']):
            labels[cid] = "Core Systems & State Machine"
        elif any(k in node_str for k in ['room', 'scenario', 'scenarioregistry']):
            labels[cid] = "Chamber Scenarios & Descent Stages"
        elif any(k in node_str for k in ['audio', 'music', 'sound']):
            labels[cid] = "Procedural Audio & Acoustic Synthesis"
        elif any(k in node_str for k in ['screen', 'ui', 'raycast', 'inspect']):
            labels[cid] = "UI Overlays & Interaction Reticle"
        elif any(k in node_str for k in ['test', 'e2e', 'visual']):
            labels[cid] = "Automated Test Verification"
        elif any(k in node_str for k in ['procedural', 'texture', 'entity']):
            labels[cid] = "3D Procedural Room Entities & Shaders"
        else:
            labels[cid] = f"Architecture Cluster {cid}"

    questions = suggest_questions(G, communities, labels)

    # 8. Export graph.json and report
    (out_dir / 'graph.json').unlink(missing_ok=True)
    wrote = to_json(G, communities, str(out_dir / 'graph.json'))
    if not wrote:
        print("[graphify] Warning: refused to shrink graph.json")

    report = generate(
        G, communities, cohesion, labels, gods, surprises,
        detection, {'input': 0, 'output': 0}, str(root),
        suggested_questions=questions
    )
    (out_dir / 'GRAPH_REPORT.md').write_text(report, encoding='utf-8')

    analysis = {
        'communities': {str(k): v for k, v in communities.items()},
        'cohesion': {str(k): v for k, v in cohesion.items()},
        'gods': gods,
        'surprises': surprises,
        'questions': questions,
    }
    (out_dir / '.graphify_analysis.json').write_text(json.dumps(analysis, indent=2, ensure_ascii=False), encoding='utf-8')
    (out_dir / '.graphify_labels.json').write_text(json.dumps({str(k): v for k, v in labels.items()}, ensure_ascii=False), encoding='utf-8')

    # 9. Export Visual HTML
    try:
        to_html(G, communities, str(out_dir / 'graph.html'), community_labels=labels)
        print(f"[graphify] Visual HTML exported: {out_dir / 'graph.html'}")
    except Exception as e:
        print(f"[graphify] HTML export note: {e}")

    # 10. Save Manifest
    save_manifest(detection.get('all_files') or detection['files'], root=str(root))
    print(f"[graphify] SUCCESS: Built graph with {G.number_of_nodes()} nodes, {G.number_of_edges()} edges, {len(communities)} communities.")

if __name__ == '__main__':
    main()
