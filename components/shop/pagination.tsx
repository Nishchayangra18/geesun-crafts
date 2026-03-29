"use client";

import type { ReactNode } from "react";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

type PaginationItem = number | "ellipsis-left" | "ellipsis-right";

function getDesktopPageItems(currentPage: number, totalPages: number): PaginationItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "ellipsis-right", totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [1, "ellipsis-left", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, "ellipsis-left", currentPage - 1, currentPage, currentPage + 1, "ellipsis-right", totalPages];
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= totalPages;
  const pageItems = getDesktopPageItems(currentPage, totalPages);

  return (
    <nav className="mt-8 flex flex-col items-center gap-3" aria-label="Pagination">
      <div className="flex items-center justify-center gap-2">
        <PaginationButton onClick={() => onPageChange(currentPage - 1)} disabled={isFirstPage}>
          Previous
        </PaginationButton>

        <div className="hidden items-center gap-2 sm:flex">
          {pageItems.map((item, index) =>
            typeof item === "number" ? (
              <PageNumberButton
                key={item}
                page={item}
                isCurrent={item === currentPage}
                onClick={() => onPageChange(item)}
              />
            ) : (
              <span
                key={`${item}-${index}`}
                className="inline-flex h-10 min-w-12 items-center justify-center rounded-full border border-[var(--border-soft)] bg-[#f7f1e4] px-4 text-sm text-[var(--text-muted)]"
              >
                ...
              </span>
            ),
          )}
        </div>

        <div className="sm:hidden">
          <PageNumberButton page={currentPage} isCurrent onClick={() => onPageChange(currentPage)} />
        </div>

        <PaginationButton onClick={() => onPageChange(currentPage + 1)} disabled={isLastPage}>
          Next
        </PaginationButton>
      </div>

      <p className="text-center text-xs text-[color:rgb(113_105_95_/_0.8)]">
        Page {currentPage} of {totalPages}
      </p>
    </nav>
  );
}

function PaginationButton({
  children,
  onClick,
  disabled = false,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-10 items-center justify-center rounded-full border border-[var(--border-soft)] bg-[#f7f1e4] px-4 text-sm text-[var(--text-primary)] transition-all duration-200 hover:border-[rgb(107_125_94_/_0.4)] hover:bg-[rgb(107_125_94_/_0.1)] hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-[var(--border-soft)] disabled:hover:bg-[#f7f1e4]"
    >
      {children}
    </button>
  );
}

function PageNumberButton({
  page,
  isCurrent = false,
  onClick,
}: {
  page: number;
  isCurrent?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={isCurrent ? "page" : undefined}
      className={`inline-flex h-10 min-w-10 items-center justify-center rounded-full border px-4 text-sm transition-all duration-200 ${
        isCurrent
          ? "border-[var(--olive)] bg-[var(--olive)] font-semibold text-white shadow-[0_6px_16px_rgb(107_125_94_/_0.25)]"
          : "border-[var(--border-soft)] bg-[#f7f1e4] text-[var(--text-primary)] hover:border-[rgb(107_125_94_/_0.4)] hover:bg-[rgb(107_125_94_/_0.1)]"
      }`}
    >
      {page}
    </button>
  );
}
