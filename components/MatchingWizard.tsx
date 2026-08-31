"use client";

import { Plus, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { Badge, Button, ErrorNote, SegmentedTabs, cx, fieldClass } from "@/components/ui";

export const MATCH_SETUP_KEY = "matchr:match-setup";
export const MATCH_SOURCE_KEY = "matchr:job-source";

export type MatchLimit = 5 | 10 | 15;
export type WorkMode = "remote" | "hybrid" | "onsite";
export type EmploymentType =
  | "full_time"
  | "part_time"
  | "contract"
  | "seasonal"
  | "internship";
export type PayPeriod = "hourly" | "annual";

export type MatchSetup = {
  limit: MatchLimit;
  desiredRoles: string[];
  workModes: WorkMode[];
  employmentTypes: EmploymentType[];
  payMin: number | null;
  payPeriod: PayPeriod;
};

const LIMITS: ReadonlyArray<{ value: MatchLimit; title: string; hint: string }> = [
  { value: 5, title: "5 roles", hint: "Tight shortlist" },
  { value: 10, title: "10 roles", hint: "Default pass" },
  { value: 15, title: "15 roles", hint: "Wider scan" },
];

export const WORK_MODES: ReadonlyArray<{ value: WorkMode; label: string }> = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "On-site" },
];

export const EMPLOYMENT_TYPES: ReadonlyArray<{ value: EmploymentType; label: string }> = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "seasonal", label: "Seasonal" },
  { value: "internship", label: "Internship" },
];

const WORK_MODE_VALUES = WORK_MODES.map((item) => item.value);
const EMPLOYMENT_VALUES = EMPLOYMENT_TYPES.map((item) => item.value);

export function defaultMatchSetup(savedTargetTitle: string | null): MatchSetup {
  const saved = savedTargetTitle?.trim() ?? "";
  return {
    limit: 10,
    desiredRoles: saved ? [saved] : [],
    workModes: [...WORK_MODE_VALUES],
    employmentTypes: [...EMPLOYMENT_VALUES],
    payMin: null,
    payPeriod: "annual",
  };
}

export function readMatchSetup(): MatchSetup | null {
  try {
    const raw = window.sessionStorage.getItem(MATCH_SETUP_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<MatchSetup> & {
      roleMode?: string;
      customTitle?: string;
    };
    if (parsed.limit !== 5 && parsed.limit !== 10 && parsed.limit !== 15) return null;
    return {
      limit: parsed.limit,
      desiredRoles: parseDesiredRoles(parsed),
      workModes: parseAllowed(parsed.workModes, WORK_MODE_VALUES) ?? [...WORK_MODE_VALUES],
      employmentTypes:
        parseAllowed(parsed.employmentTypes, EMPLOYMENT_VALUES) ?? [...EMPLOYMENT_VALUES],
      payMin: parsePayMin(parsed.payMin),
      payPeriod: parsed.payPeriod === "hourly" ? "hourly" : "annual",
    };
  } catch {
    return null;
  }
}

export function writeMatchSetup(setup: MatchSetup) {
  window.sessionStorage.setItem(MATCH_SETUP_KEY, JSON.stringify(setup));
}

export function matchSetupSummary(setup: MatchSetup): string {
  const roles = setup.desiredRoles.join(", ") || "your target roles";
  const work = setup.workModes
    .map((value) => WORK_MODES.find((item) => item.value === value)?.label)
    .filter(Boolean)
    .join(" / ");
  const types = setup.employmentTypes
    .map((value) => EMPLOYMENT_TYPES.find((item) => item.value === value)?.label)
    .filter(Boolean)
    .join(", ");
  const pay =
    setup.payMin == null
      ? null
      : setup.payPeriod === "hourly"
        ? `$${setup.payMin}/hr+`
        : `$${setup.payMin.toLocaleString()}+`;
  return [roles, work, types, pay].filter(Boolean).join(" · ");
}

function parseDesiredRoles(
  parsed: Partial<MatchSetup> & { roleMode?: string; customTitle?: string },
): string[] {
  if (Array.isArray(parsed.desiredRoles)) {
    return uniqueRoles(parsed.desiredRoles);
  }
  const legacy = typeof parsed.customTitle === "string" ? parsed.customTitle.trim() : "";
  return legacy ? [legacy] : [];
}

function parseAllowed<T extends string>(value: unknown, allowed: readonly T[]): T[] | null {
  if (!Array.isArray(value)) return null;
  const next = value.filter((item): item is T => allowed.includes(item as T));
  return next.length ? next : null;
}

function parsePayMin(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return null;
  return value;
}

function uniqueRoles(values: unknown[]): string[] {
  const seen = new Set<string>();
  const roles: string[] = [];
  for (const value of values) {
    if (typeof value !== "string") continue;
    const role = value.trim();
    const key = role.toLowerCase();
    if (!role || seen.has(key)) continue;
    seen.add(key);
    roles.push(role);
  }
  return roles;
}

function toggleValue<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export function MatchingWizard({
  open,
  savedTargetTitle,
  initial,
  busy,
  error,
  onClose,
  onProceed,
}: {
  open: boolean;
  savedTargetTitle: string | null;
  initial?: MatchSetup | null;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onProceed: (setup: MatchSetup) => Promise<void>;
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);

  const [mounted, setMounted] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [limit, setLimit] = useState<MatchLimit>(10);
  const [desiredRoles, setDesiredRoles] = useState<string[]>([]);
  const [roleDraft, setRoleDraft] = useState("");
  const [workModes, setWorkModes] = useState<WorkMode[]>([...WORK_MODE_VALUES]);
  const [employmentTypes, setEmploymentTypes] = useState<EmploymentType[]>([...EMPLOYMENT_VALUES]);
  const [payInput, setPayInput] = useState("");
  const [payPeriod, setPayPeriod] = useState<PayPeriod>("annual");

  useEffect(() => {
    if (open) {
      if (!wasOpen.current) {
        const seed = initial ?? defaultMatchSetup(savedTargetTitle);
        const saved = savedTargetTitle?.trim() ?? "";
        setLimit(seed.limit);
        setDesiredRoles(
          seed.desiredRoles.length ? seed.desiredRoles : saved ? [saved] : [],
        );
        setRoleDraft("");
        setWorkModes(seed.workModes.length ? seed.workModes : [...WORK_MODE_VALUES]);
        setEmploymentTypes(
          seed.employmentTypes.length ? seed.employmentTypes : [...EMPLOYMENT_VALUES],
        );
        setPayInput(seed.payMin == null ? "" : String(seed.payMin));
        setPayPeriod(seed.payPeriod);
      }
      wasOpen.current = true;
      setMounted(true);
      setLeaving(false);
      return;
    }
    wasOpen.current = false;
    if (!mounted) return;
    setLeaving(true);
    const timer = window.setTimeout(() => {
      setMounted(false);
      setLeaving(false);
    }, 200);
    return () => window.clearTimeout(timer);
    // Seed the form only on the closed → open transition.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open || !mounted || leaving) return;
    const frame = window.requestAnimationFrame(() => dialogRef.current?.focus());
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previous;
    };
  }, [open, mounted, leaving]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onClose]);

  if (!mounted) return null;

  const trimmedPay = payInput.trim();
  const payMin = trimmedPay === "" ? null : Number(payInput);
  const payValid = payMin === null || (Number.isFinite(payMin) && payMin > 0);
  const setup: MatchSetup = {
    limit,
    desiredRoles,
    workModes,
    employmentTypes,
    payMin: payValid ? payMin : null,
    payPeriod,
  };
  const canProceed =
    desiredRoles.length > 0 &&
    workModes.length > 0 &&
    employmentTypes.length > 0 &&
    payValid;

  function addRole(raw: string) {
    const next = uniqueRoles([...desiredRoles, raw]);
    if (next.length === desiredRoles.length) return;
    setDesiredRoles(next);
    setRoleDraft("");
  }

  return (
    <div
      className={cx(
        "fixed inset-0 z-50 flex items-center justify-center p-4",
        leaving ? "animate-[var(--animate-fade-out)]" : "animate-[var(--animate-fade)]",
      )}
    >
      <div
        className="absolute inset-0 bg-zinc-950/35 backdrop-blur-[3px]"
        onClick={() => {
          if (!busy) onClose();
        }}
        role="presentation"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cx(
          "relative z-10 flex max-h-[min(44rem,calc(100vh-2rem))] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-pop outline-none",
          leaving ? "animate-[var(--animate-pop-out)]" : "animate-[var(--animate-pop)]",
        )}
      >
        <div className="h-1 shrink-0 bg-zinc-100">
          <div className="h-full w-full bg-brand-500" />
        </div>

        <div className="flex shrink-0 items-start justify-between gap-3 px-5 pt-5">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
              Before matching
            </p>
            <h2 id={titleId} className="mt-1 text-lg font-semibold tracking-tight text-zinc-950">
              What should this pass show?
            </h2>
          </div>
          {busy ? null : (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close matching setup"
              className="-mr-1 -mt-1 inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {error ? (
          <div className="px-5 pt-3">
            <ErrorNote message={error} />
          </div>
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-2 pt-4">
          <p className="text-sm leading-6 text-zinc-600">
            Matching ranks live jobs against your profile, then keeps the ones that fit how you
            want to work — location type, pay floor, and job type.
          </p>

          <p className="mt-4 text-xs font-medium text-zinc-700">How many roles to return</p>
          <SegmentedTabs
            className="mt-1.5 w-full [&_button]:flex-1 [&_button]:justify-center"
            items={LIMITS.map((option) => ({
              value: String(option.value) as `${MatchLimit}`,
              label: option.title,
            }))}
            value={String(limit) as `${MatchLimit}`}
            onChange={(value) => setLimit(Number(value) as MatchLimit)}
          />
          <p className="mt-1.5 text-xs text-zinc-500">
            Exactly {limit} ranked roles, best first. You can target up to 5 afterward.
          </p>

          <p className="mt-4 text-xs font-medium text-zinc-700">Desired roles</p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            Add every title you want this pass to search. The first one updates your saved career
            goal.
          </p>
          {desiredRoles.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {desiredRoles.map((role, index) => (
                <Badge key={role.toLowerCase()} tone={index === 0 ? "brand" : "neutral"}>
                  {role}
                  <button
                    type="button"
                    aria-label={`Remove ${role}`}
                    disabled={busy}
                    onClick={() =>
                      setDesiredRoles((current) => current.filter((item) => item !== role))
                    }
                    className="-mr-0.5 rounded-full p-0.5 text-current/70 hover:bg-black/5 hover:text-current"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          ) : null}
          <div className="mt-2 flex gap-2">
            <input
              value={roleDraft}
              onChange={(event) => setRoleDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter") return;
                event.preventDefault();
                addRole(roleDraft);
              }}
              placeholder="AI Product Engineer"
              aria-label="Add a desired role"
              disabled={busy}
              className={cx(fieldClass, "flex-1")}
            />
            <Button
              type="button"
              variant="secondary"
              disabled={busy || roleDraft.trim().length === 0}
              onClick={() => addRole(roleDraft)}
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
          </div>

          <p className="mt-4 text-xs font-medium text-zinc-700">Work arrangement</p>
          <p className="mt-1 text-xs text-zinc-500">Select every setup you would take.</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {WORK_MODES.map((option) => (
              <ToggleChip
                key={option.value}
                label={option.label}
                selected={workModes.includes(option.value)}
                disabled={busy}
                onClick={() => setWorkModes((current) => toggleValue(current, option.value))}
              />
            ))}
          </div>

          <p className="mt-4 text-xs font-medium text-zinc-700">Job type</p>
          <p className="mt-1 text-xs text-zinc-500">Part-time, contract, and internships stay in if selected.</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {EMPLOYMENT_TYPES.map((option) => (
              <ToggleChip
                key={option.value}
                label={option.label}
                selected={employmentTypes.includes(option.value)}
                disabled={busy}
                onClick={() =>
                  setEmploymentTypes((current) => toggleValue(current, option.value))
                }
              />
            ))}
          </div>

          <p className="mt-4 text-xs font-medium text-zinc-700">Minimum pay</p>
          <p className="mt-1 text-xs text-zinc-500">
            Optional. Leave blank if pay should not filter this pass.
          </p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">
                $
              </span>
              <input
                type="number"
                min={1}
                inputMode="numeric"
                value={payInput}
                onChange={(event) => setPayInput(event.target.value)}
                placeholder={payPeriod === "hourly" ? "25" : "80000"}
                aria-label="Minimum pay"
                disabled={busy}
                className={cx(fieldClass, "pl-7")}
              />
            </div>
            <SegmentedTabs
              className="shrink-0"
              items={[
                { value: "hourly", label: "Hourly" },
                { value: "annual", label: "Annual" },
              ]}
              value={payPeriod}
              onChange={setPayPeriod}
            />
          </div>
          {!payValid ? (
            <p className="mt-1.5 text-xs text-rose-600">Enter a pay floor above 0, or clear the field.</p>
          ) : null}
        </div>

        <div className="shrink-0 border-t border-line px-5 py-4">
          <Button
            type="button"
            className="w-full"
            loading={busy}
            disabled={!canProceed || busy}
            onClick={() => void onProceed(setup)}
          >
            Proceed to job matching
          </Button>
        </div>
      </div>
    </div>
  );
}

function ToggleChip({
  label,
  selected,
  disabled,
  onClick,
}: {
  label: string;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={selected}
      className={cx(
        "rounded-full border px-3 py-1.5 text-xs font-medium transition-[border-color,background-color,color]",
        selected
          ? "border-brand-400 bg-brand-50 text-brand-800 ring-2 ring-brand-400/25"
          : "border-line bg-surface text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      {label}
    </button>
  );
}
