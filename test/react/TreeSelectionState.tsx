import React, { useMemo, useState } from "react";

type TreeNode = {
  id: string;
  label: string;
  children?: TreeNode[];
};

type Props = {
  root: TreeNode[];
};

type SelectedMap = Record<string, boolean>;

function collectDescendantIds(node: TreeNode): string[] {
  const ids = [node.id];
  for (const child of node.children ?? []) {
    ids.push(...collectDescendantIds(child));
  }
  return ids;
}

function isIndeterminate(node: TreeNode, selected: SelectedMap): boolean {
  const children = node.children ?? [];
  if (children.length === 0) return false;

  const ids = children.flatMap(collectDescendantIds);
  const selectedCount = ids.filter((id) => selected[id]).length;

  return selectedCount > 0 && selectedCount < ids.length;
}

export default function TreeSelectionState({ root }: Props) {
  const [selected, setSelected] = useState<SelectedMap>({});

  const totalSelected = useMemo(
    () => Object.values(selected).filter(Boolean).length,
    [selected]
  );

  const toggleNode = (node: TreeNode) => {
    const ids = collectDescendantIds(node);
    const allSelected = ids.every((id) => selected[id]);

    setSelected((prev) => {
      const next = { ...prev };
      for (const id of ids) {
        next[id] = !allSelected;
      }
      return next;
    });
  };

  const renderNode = (node: TreeNode, depth: number = 0): React.ReactNode => {
    const checked = !!selected[node.id];
    const indeterminate = isIndeterminate(node, selected);

    return (
      <div key={node.id} style={{ marginLeft: depth * 16, display: "grid", gap: 6 }}>
        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={checked}
            ref={(el) => {
              if (el) {
                el.indeterminate = indeterminate;
              }
            }}
            onChange={() => toggleNode(node)}
          />
          <span>{node.label}</span>
        </label>

        {(node.children ?? []).map((child) => renderNode(child, depth + 1))}
      </div>
    );
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ fontWeight: 600 }}>Selected count: {totalSelected}</div>
      <div>{root.map((node) => renderNode(node))}</div>
    </div>
  );
}
