"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Search,
  SlidersHorizontal,
  X,
  Eraser,
  Eye,
  Check,
} from "lucide-react";
import { H5, SubtitleSm, bodySmBaseCls } from "./typography";
import { OutlineButton, FilledButton } from "./button";
import { useScrollLock } from "./use-scroll-lock";
import { usePagedList, PagedListControls } from "./paged-list";

/** Options shown per filter group before "Show more". */
const GROUP_PAGE_SIZE = 6;

const SPRING        = { type: "spring" as const, duration: 0.4, bounce: 0.2, delay: 0 };
const SPRING_POPUP  = { type: "spring" as const, duration: 0.4, bounce: 0,   delay: 0 };


export interface FilterItem {
  id:   string;
  name: string;
  slug: string;
}

function CheckboxItem({
  item,
  checked,
  onToggle,
}: {
  item:     FilterItem;
  checked:  boolean;
  onToggle: () => void;
}) {
  const [focused, setFocused] = useState(false);
  const borderColor = focused || checked ? "black" : "var(--color-beige)";
  const bgColor     = checked ? "black" : "white";

  return (
    <label className="flex flex-row justify-start items-center gap-[10px] w-full p-0 overflow-visible cursor-pointer select-none">
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={onToggle}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      <span
        className="w-5 h-5 flex-shrink-0 rounded-none flex items-center justify-center"
        style={{
          border: `1px solid ${borderColor}`,
          backgroundColor: bgColor,
          transition: "background-color 0.3s cubic-bezier(0.44, 0, 0.56, 1), border-color 0.3s cubic-bezier(0.44, 0, 0.56, 1)",
        }}
      >
        {checked && <Check size={14} strokeWidth={2.5} className="text-white" />}
      </span>
      <span className={`${bodySmBaseCls} text-black`}>{item.name}</span>
    </label>
  );
}

/**
 * A filter group with its own hardcoded "All" at the top.
 *
 * An empty selection already means "no filter applied", so "All" is not a real
 * option that has to be stored — it is the reading of a group that is not
 * narrowing anything. It shows checked in the two cases that come to the same
 * thing: nothing picked, or every option picked by hand. Choosing it clears the
 * group back to that neutral state.
 *
 * Nothing here can leave a group with zero options selected — unchecking the
 * last one lands on "All" rather than on a shop with nothing in it.
 */
function CheckboxGroup({
  title,
  items,
  selected,
  onToggle,
  onSelectAll,
}: {
  title:       string;
  items:       FilterItem[];
  selected:    Set<string>;
  onToggle:    (id: string) => void;
  onSelectAll: () => void;
}) {
  // Before the early return: a group can empty out between renders, and hooks
  // cannot be skipped.
  const paged = usePagedList(items, GROUP_PAGE_SIZE);

  if (items.length === 0) return null;

  const all = selected.size === 0 || selected.size === items.length;

  // A pick further down the list must stay visible after "Show less", so the
  // hidden tail is checked and reported rather than silently dropped.
  const hiddenPicks = items
    .slice(paged.visible.length)
    .filter((item) => selected.has(item.id)).length;

  return (
    <div className="w-full flex flex-col justify-start items-start gap-[8px]">
      <SubtitleSm className="w-full !text-black">{title}</SubtitleSm>
      <CheckboxItem
        item={{ id: "__all__", name: "All", slug: "all" }}
        checked={all}
        // Already the whole group: re-picking it would only be a way to show
        // nothing, so it stays put.
        onToggle={() => { if (selected.size > 0) onSelectAll(); }}
      />
      {paged.visible.map((item) => (
        <CheckboxItem
          key={item.id}
          item={item}
          checked={selected.has(item.id)}
          onToggle={() => onToggle(item.id)}
        />
      ))}
      {hiddenPicks > 0 && (
        <span className={`${bodySmBaseCls} text-brown`}>
          +{hiddenPicks} selected below
        </span>
      )}
      <PagedListControls
        remaining={paged.remaining}
        expanded={paged.expanded}
        onMore={paged.showMore}
        onLess={paged.showLess}
      />
    </div>
  );
}

export interface FiltersProps {
  categories:         FilterItem[];
  collections:        FilterItem[];
  skinTypes:          FilterItem[];
  searchValue:        string;
  onSearchChange:     (v: string) => void;
  selectedCategories: Set<string>;
  onCategoryToggle:   (id: string) => void;
  onCategoryAll:      () => void;
  selectedCollections: Set<string>;
  onCollectionToggle:  (id: string) => void;
  onCollectionAll:     () => void;
  selectedSkinTypes:  Set<string>;
  onSkinTypeToggle:   (id: string) => void;
  onSkinTypeAll:      () => void;
  onClear:            () => void;
  className?:         string;
}

function FilterSections({
  categories, collections, skinTypes,
  searchValue, onSearchChange,
  selectedCategories, onCategoryToggle, onCategoryAll,
  selectedCollections, onCollectionToggle, onCollectionAll,
  selectedSkinTypes, onSkinTypeToggle, onSkinTypeAll,
}: Omit<FiltersProps, "onClear" | "className">) {
  return (
    <>
      {/* Search */}
      <div className="w-full flex flex-col justify-start items-start gap-[8px]">
        <SubtitleSm className="w-full !text-black">Search</SubtitleSm>
        <div className="relative w-full">
          <input
            type="text"
            placeholder="Search…"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-[40px] font-inter font-normal text-black text-[14px] bg-white border border-beige rounded-none pl-[36px] pr-[12px] placeholder:text-brown focus:outline-none focus:border-black"
            style={{ lineHeight: "1.2em", letterSpacing: "0em", transition: "border-color 0.3s cubic-bezier(0.44, 0, 0.56, 1)" }}
          />
          <Search size={16} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-brown pointer-events-none" />
        </div>
      </div>

      <CheckboxGroup
        title="Category"
        items={categories}
        selected={selectedCategories}
        onToggle={onCategoryToggle}
        onSelectAll={onCategoryAll}
      />

      {/* Skin type — stays hidden until the dashboard list has entries */}
      <CheckboxGroup
        title="Skin type"
        items={skinTypes}
        selected={selectedSkinTypes}
        onToggle={onSkinTypeToggle}
        onSelectAll={onSkinTypeAll}
      />

      <CheckboxGroup
        title="Collection"
        items={collections}
        selected={selectedCollections}
        onToggle={onCollectionToggle}
        onSelectAll={onCollectionAll}
      />
    </>
  );
}

export function Filters({
  categories, collections, skinTypes,
  searchValue, onSearchChange,
  selectedCategories, onCategoryToggle, onCategoryAll,
  selectedCollections, onCollectionToggle, onCollectionAll,
  selectedSkinTypes, onSkinTypeToggle, onSkinTypeAll,
  onClear,
  className = "",
}: FiltersProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [isMobile,   setIsMobile]   = useState(false);
  const [mounted,    setMounted]    = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const shouldLock = isMobile && filterOpen;
    document.body.style.overflow = shouldLock ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isMobile, filterOpen]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 810);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useScrollLock(isMobile && filterOpen);

  const sectionProps = {
    categories, collections, skinTypes,
    searchValue, onSearchChange,
    selectedCategories, onCategoryToggle, onCategoryAll,
    selectedCollections, onCollectionToggle, onCollectionAll,
    selectedSkinTypes, onSkinTypeToggle, onSkinTypeAll,
  };

  return (
    <>
      <motion.div
        className={`flex flex-col justify-start items-start gap-[32px] rounded-none
          w-full tablet:w-[227px]
          border border-dusty tablet:border-0
          bg-white tablet:bg-transparent
          p-0
          ${className}`}
        transition={SPRING}
      >
        {/* Toggle — mobile only, the sections stand on their own from tablet up.
            The whole bar is the target, not just the icon: it reads as one
            tappable strip, so anything less feels broken under a thumb. */}
        <button
          type="button"
          className="w-full tablet:hidden flex flex-row justify-between items-center gap-[16px] pt-2 pr-3 pb-2 pl-4 bg-transparent border-none cursor-pointer text-left"
          onClick={() => setFilterOpen((v) => !v)}
          aria-expanded={filterOpen}
          aria-label="Toggle filters"
        >
          <SubtitleSm className="!text-black !text-left">Filters</SubtitleSm>
          <span className="flex items-center justify-center text-black">
            {filterOpen ? <X size={24} strokeWidth={1} /> : <SlidersHorizontal size={24} strokeWidth={1} />}
          </span>
        </button>

        {/* Desktop: inline filter content */}
        <div className="hidden tablet:flex flex-col gap-[32px] w-full">
          <FilterSections {...sectionProps} />
          <div className="w-full pt-[24px] border-t border-beige">
            <OutlineButton onClick={onClear} icon={<Eraser size={16} />} className="w-full">
              Clear Filter
            </OutlineButton>
          </div>
        </div>
      </motion.div>

      {/* Mobile: portal popup */}
      {mounted && createPortal(
        <AnimatePresence>
          {isMobile && filterOpen && (
            <>
              <motion.div
                key="overlay"
                className="fixed inset-0 z-40 bg-plum"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                exit={{ opacity: 0 }}
                transition={SPRING_POPUP}
                onClick={() => setFilterOpen(false)}
              />
              <motion.div
                key="sheet"
                className="fixed inset-0 z-50 flex items-center justify-center p-[24px] pointer-events-none"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={SPRING_POPUP}
              >
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="filters-title"
                  className="bg-white w-full max-w-[400px] max-h-[85vh] rounded-none overflow-y-auto flex flex-col gap-[32px] px-[24px] pt-[24px] pb-[32px] pointer-events-auto"
                >
                  <div className="flex flex-row justify-between items-center gap-[16px]">
                    <H5 id="filters-title" className="!text-black !text-left">Filters</H5>
                    <button
                      className="flex items-center justify-center p-0 bg-transparent border-none cursor-pointer text-black"
                      onClick={() => setFilterOpen(false)}
                      aria-label="Close filters"
                    >
                      <X size={24} strokeWidth={1} />
                    </button>
                  </div>
                  <FilterSections {...sectionProps} />
                  <div className="w-full flex flex-col gap-[16px] pt-[24px] border-t border-beige">
                    <OutlineButton onClick={onClear} icon={<Eraser size={16} />} className="w-full">
                      Clear Filter
                    </OutlineButton>
                    <FilledButton icon={<Eye size={16} />} className="w-full" onClick={() => setFilterOpen(false)}>
                      Show Results
                    </FilledButton>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
