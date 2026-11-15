"use client";

import Link from "next/link";
import { LayoutTemplate, Plus, RefreshCw } from "lucide-react";
import { AppShellActions, FilterButton, IconButton, Popover, PopoverContent, PopoverTrigger, SearchInput, cn } from "@skylab-kulubu/skylcn-ui";
import FormsFilterShell from "./utils/FormsFilterShell";
import DatabaseFilters from "./form-database/DatabaseFilters";
import { filterCount } from "./form-database/database-params";
import WorkflowsFilterShell from "./utils/WorkflowsFilterShell";

// From md the toolbar sits in the shell's header row; on phones that row is the top bar, so it goes above the list
function ListToolbar({ title, toolbar }) {
  return (
    <>
      <h1 className="sr-only">{title}</h1>
      <AppShellActions>
        <div className="hidden items-center gap-1.5 md:flex">{toolbar(true)}</div>
      </AppShellActions>
      <div className="flex w-full items-center gap-2 md:hidden">{toolbar(false)}</div>
    </>
  );
}

const iconSize = (inHeader) => (inHeader ? "icon" : "icon-lg");

function FilterMenu({ inHeader, count, label, className, children }) {
  return (
    <Popover>
      <PopoverTrigger render={<FilterButton iconOnly count={count} size={iconSize(inHeader)} />} />
      {/* The panels hand their groups over as direct children, so they step in and out one by one */}
      <PopoverContent stagger align={inHeader ? "end" : "center"} aria-label={label} className={cn("flex flex-col gap-4", className)}>{children}</PopoverContent>
    </Popover>
  );
}

function Search({ inHeader, value = "", onChange, placeholder }) {
  return <SearchInput compact={inHeader} value={value} onValueChange={(next) => onChange?.(next)} placeholder={placeholder} />;
}

function FormsToolbar({ inHeader, searchValue, onSearchChange, onRefresh, onCreate, ...filters }) {
  const { sortValue = "desc", roleValue = "all", allowAnonymous = null, allowMultiple = null, requiresManualReview = null, stateValue = "all" } = filters;
  const active = [stateValue !== "all", sortValue !== "desc", roleValue !== "all", allowAnonymous !== null, allowMultiple !== null, requiresManualReview !== null].filter(Boolean).length;

  return (
    <>
      <Search inHeader={inHeader} value={searchValue} onChange={onSearchChange} placeholder="Form ara" />
      <div className="flex shrink-0 items-center gap-1.5">
        {/* Wider than the other panels so the five state pills and their counts fit on one line */}
        <FilterMenu inHeader={inHeader} count={active} label="Form filtreleri" className="w-96">
          <FormsFilterShell {...filters} />
        </FilterMenu>
        <IconButton icon={RefreshCw} label="Yenile" variant="ghost" size={iconSize(inHeader)} onClick={onRefresh} />
        <IconButton icon={Plus} label="Yeni form ekle" variant="primary" size={iconSize(inHeader)} onClick={onCreate} />
      </div>
    </>
  );
}

export function FormsHeader(toolbarProps) {
  return <ListToolbar title="Formlar" toolbar={(inHeader) => <FormsToolbar inHeader={inHeader} {...toolbarProps} />} />;
}

export function DashboardHeader({ onRefresh }) {
  return (
    <AppShellActions>
      <div className="hidden items-center gap-1.5 lg:flex">
        <IconButton icon={RefreshCw} label="Yenile" variant="ghost" onClick={onRefresh} />
        <IconButton icon={LayoutTemplate} label="Şablonlar" variant="ghost" render={<Link href="/admin/templates" />} />
        <IconButton icon={Plus} label="Yeni form ekle" variant="primary" render={<Link href="/admin/forms/new-form" />} />
      </div>
    </AppShellActions>
  );
}

function GroupsToolbar({ inHeader, searchValue, onSearchChange, onRefresh, onCreate }) {
  return (
    <>
      <Search inHeader={inHeader} value={searchValue} onChange={onSearchChange} placeholder="Şablon ara" />
      <div className="flex shrink-0 items-center gap-1.5">
        <IconButton icon={RefreshCw} label="Yenile" variant="ghost" size={iconSize(inHeader)} onClick={onRefresh} />
        <IconButton icon={Plus} label="Yeni şablon ekle" variant="primary" size={iconSize(inHeader)} onClick={onCreate} />
      </div>
    </>
  );
}

export function GroupsHeader(toolbarProps) {
  return <ListToolbar title="Şablonlar" toolbar={(inHeader) => <GroupsToolbar inHeader={inHeader} {...toolbarProps} />} />;
}

function WorkflowsToolbar({ inHeader, searchValue, onSearchChange, sortValue = "desc", onSortChange, showArchived = false, onShowArchivedChange, onRefresh, onCreate }) {
  const active = [sortValue !== "desc", showArchived !== false].filter(Boolean).length;

  return (
    <>
      <Search inHeader={inHeader} value={searchValue} onChange={onSearchChange} placeholder="Akış ara" />
      <div className="flex shrink-0 items-center gap-1.5">
        <FilterMenu inHeader={inHeader} count={active} label="Akış filtreleri">
          <WorkflowsFilterShell sortValue={sortValue} onSortChange={onSortChange} showArchived={showArchived} onShowArchivedChange={onShowArchivedChange} />
        </FilterMenu>
        <IconButton icon={RefreshCw} label="Yenile" variant="ghost" size={iconSize(inHeader)} onClick={onRefresh} />
        {onCreate ? <IconButton icon={Plus} label="Yeni akış ekle" variant="primary" size={iconSize(inHeader)} onClick={onCreate} /> : null}
      </div>
    </>
  );
}

export function WorkflowsHeader(toolbarProps) {
  return <ListToolbar title="Akışlar" toolbar={(inHeader) => <WorkflowsToolbar inHeader={inHeader} {...toolbarProps} />} />;
}

function DatabaseToolbar({ inHeader, searchValue, onSearchChange, state, onChange, onClear, summary = null, owners = [], onRefresh }) {
  return (
    <>
      <Search inHeader={inHeader} value={searchValue} onChange={onSearchChange} placeholder="Form adı ya da ID" />
      <div className="flex shrink-0 items-center gap-1.5">
        <FilterMenu inHeader={inHeader} count={filterCount(state)} label="Veritabanı filtreleri">
          <DatabaseFilters state={state} onChange={onChange} onClear={onClear} summary={summary} owners={owners} />
        </FilterMenu>
        <IconButton icon={RefreshCw} label="Yenile" variant="ghost" size={iconSize(inHeader)} onClick={onRefresh} />
      </div>
    </>
  );
}

export function DatabaseHeader(toolbarProps) {
  return <ListToolbar title="Veritabanı" toolbar={(inHeader) => <DatabaseToolbar inHeader={inHeader} {...toolbarProps} />} />;
}
