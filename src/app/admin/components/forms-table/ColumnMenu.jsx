"use client";

import { Columns3, RotateCcw } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, IconButton, MenuCheckboxItem, MenuGroup, MenuItem, MenuSeparator } from "@skylab-kulubu/skylcn-ui";
import { TABLE_COLUMNS, isDefaultHidden } from "./table-data";

export default function ColumnMenu({ hidden, onToggle, onReset }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<IconButton icon={Columns3} label="Sütunlar" variant="ghost" size="icon-sm" tooltip={false} />} />
      <DropdownMenuContent align="end" className="w-44">
        <MenuGroup label="Sütunlar">
          {TABLE_COLUMNS.map((column) => (
            <MenuCheckboxItem key={column.id} checked={!hidden.has(column.id)} onCheckedChange={() => onToggle(column.id)} closeOnClick={false}>
              {column.label}
            </MenuCheckboxItem>
          ))}
        </MenuGroup>
        {isDefaultHidden(hidden) ? null : (
          <>
            <MenuSeparator />
            <MenuItem icon={RotateCcw} onClick={onReset}>Varsayılana dön</MenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
