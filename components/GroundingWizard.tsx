"use client";

import {
  CheckCircle2,
  Copy,
  FileText,
  FileUp,
  Link2,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode, type RefObject } from "react";

import {
  Badge,
  Button,
  ErrorNote,
  IconTile,
  cx,
} from "@/components/ui";
import type { Candidate } from "@/lib/types";

export const LINKEDIN_SKIP_KEY = "matchr:linkedin-skipped";

export type DocumentSource = "linkedin-pdf" | "resume";
export type WizardStep = 1 | 2;

type Phase = "form" | "success";

export function GroundingWizard({
  open,
  initialStep = 1,
  candidate,
  linkedinConfigured,
  nutrientConfigured,
  linkedinCallback,
  busy,
  error,
  onClose,
  onComplete,
  onConnectLinkedin,
  onUpload,
  onSkipLinkedin,
}: {
  open: boolean;
  initialStep?: WizardStep;
  candidate: Candidate | null;
  linkedinConfigured: boolean;
  nutrientConfigured: boolean;
  linkedinCallback: string;
  busy: string | null;
  error: string | null;
  onClose: () => void;
  onComplete: () => void;
  onConnectLinkedin: () => Promise<void>;
  onUpload: (file: File) => Promise<void>;
  onSkipLinkedin: () => void;
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const completeTimer = useRef<number>(0);

  const [mounted, setMounted] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [step, setStep] = useState<WizardStep>(initialStep);
  const [source, setSource] = useState<DocumentSource | null>(null);
  const [phase, setPhase] = useState<Phase>("form");
  const [dragging, setDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const linkedinConnected = Boolean(candidate?.linkedin_connected);
  const alreadyGrounded = Boolean(candidate?.grounded);

  useEffect(() => {
    if (open) {
      setMounted(true);
      setLeaving(false);
      setStep(initialStep);
      setSource(null);
      setPhase("form");
      setDragging(false);
      return;
    }
    if (!mounted) return;
    setLeaving(true);
    const timer = window.setTimeout(() => {
      setMounted(false);
      setLeaving(false);
    }, 200);
    return () => window.clearTimeout(timer);
    // Reset form state only when the dialog opens, not on every parent render.
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
      if (event.key === "Escape" && busy === null && phase !== "success") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, phase, onClose]);

  useEffect(() => {
    if (!open || phase !== "form") return;
    if (linkedinConnected && step === 1) setStep(2);
  }, [linkedinConnected, open, phase, step]);

  useEffect(() => {
    if (phase !== "success") return;
    completeTimer.current = window.setTimeout(() => onCompleteRef.current(), 1100);
    return () => window.clearTimeout(completeTimer.current);
  }, [phase]);

  async function copyCallback() {
    try {
      await navigator.clipboard.writeText(linkedinCallback);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* parent already surfaces action errors elsewhere */
    }
  }

  async function handleUpload(file: File | undefined) {
    if (!file || busy !== null) return;
    try {
      await onUpload(file);
      setPhase("success");
    } catch {
      /* parent sets error */
    }
  }

  if (!mounted) return null;

  const canClose = busy === null && phase !== "success";

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
          if (canClose) onClose();
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
          "relative z-10 flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-pop outline-none",
          leaving ? "animate-[var(--animate-pop-out)]" : "animate-[var(--animate-pop)]",
        )}
      >
        <div className="h-1 bg-zinc-100">
          <div
            className={cx(
              "h-full transition-[width] duration-500 ease-out",
              phase === "success" ? "bg-emerald-500" : "bg-brand-500",
            )}
            style={{
              width: phase === "success" ? "100%" : step === 1 ? "50%" : "100%",
            }}
          />
        </div>

        <div className="flex items-start justify-between gap-3 px-5 pt-5">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
              {phase === "success" ? "Done" : `Step ${step} of 2`}
            </p>
            <h2 id={titleId} className="mt-1 text-lg font-semibold tracking-tight text-zinc-950">
              {phase === "success"
                ? "You're grounded"
                : step === 1
                  ? "Sign in with LinkedIn"
                  : "Add your career history"}
            </h2>
          </div>
          {canClose ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close setup"
              className="-mr-1 -mt-1 inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <StepRail step={step} phase={phase} linkedinDone={linkedinConnected} />

        {error ? (
          <div className="px-5 pt-3">
            <ErrorNote message={error} />
          </div>
        ) : null}

        <div className="px-5 pb-5 pt-4">
          {phase === "success" ? (
            <SuccessBody />
          ) : (
            <div key={step} className="animate-[var(--animate-slide-step)]">
              {step === 1 ? (
                <StepIdentity
                  linkedinConfigured={linkedinConfigured}
                  linkedinCallback={linkedinCallback}
                  copied={copied}
                  busy={busy}
                  onCopy={copyCallback}
                  onConnect={onConnectLinkedin}
                  onSkip={() => {
                    onSkipLinkedin();
                    setSource(null);
                    setStep(2);
                  }}
                />
              ) : (
                <StepDocument
                  source={source}
                  onSource={setSource}
                  fileInput={fileInput}
                  dragging={dragging}
                  setDragging={setDragging}
                  busy={busy}
                  nutrientConfigured={nutrientConfigured}
                  alreadyGrounded={alreadyGrounded}
                  canGoBack={!linkedinConnected}
                  onBack={() => {
                    setSource(null);
                    setStep(1);
                  }}
                  onFinishWithoutUpload={() => setPhase("success")}
                  onPickFile={() => fileInput.current?.click()}
                  onUpload={handleUpload}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StepRail({
  step,
  phase,
  linkedinDone,
}: {
  step: WizardStep;
  phase: Phase;
  linkedinDone: boolean;
}) {
  const firstDone = phase === "success" || linkedinDone || step === 2;
  const secondDone = phase === "success";
  return (
    <ol className="mt-4 flex items-center gap-2 px-5">
      <RailStop n={1} done={firstDone} active={step === 1 && phase === "form"} label="LinkedIn" />
      <span className={cx("h-px flex-1", firstDone ? "bg-emerald-300" : "bg-zinc-200")} />
      <RailStop n={2} done={secondDone} active={step === 2 && phase === "form"} label="History" />
    </ol>
  );
}

function RailStop({
  n,
  done,
  active,
  label,
}: {
  n: number;
  done: boolean;
  active: boolean;
  label: string;
}) {
  return (
    <li className="flex items-center gap-1.5">
      <span
        className={cx(
          "inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold",
          done
            ? "bg-emerald-500 text-white"
            : active
              ? "bg-zinc-950 text-white"
              : "bg-zinc-100 text-zinc-500",
        )}
      >
        {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : n}
      </span>
      <span className={cx("text-xs font-medium", active || done ? "text-zinc-800" : "text-zinc-400")}>
        {label}
      </span>
    </li>
  );
}

function StepIdentity({
  linkedinConfigured,
  linkedinCallback,
  copied,
  busy,
  onCopy,
  onConnect,
  onSkip,
}: {
  linkedinConfigured: boolean;
  linkedinCallback: string;
  copied: boolean;
  busy: string | null;
  onCopy: () => void;
  onConnect: () => Promise<void>;
  onSkip: () => void;
}) {
  return (
    <div>
      <div className="flex items-start gap-3">
        <IconTile tone="info" size="lg">
          <LinkedInMark className="h-4 w-4" />
        </IconTile>
        <p className="text-sm leading-6 text-zinc-600">
          Matchr pulls name, email, and photo — enough to start a portfolio without a form.
          Nothing is ever posted. You can skip this and import a document instead.
        </p>
      </div>

      {linkedinConfigured ? (
        <div className="mt-5 flex flex-col gap-2">
          <Button
            className="w-full"
            loading={busy === "linkedin"}
            disabled={busy !== null}
            onClick={() => void onConnect()}
          >
            <LinkedInMark className="h-3.5 w-3.5" />
            Sign in with LinkedIn
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            disabled={busy !== null}
            onClick={onSkip}
          >
            Skip to document upload
          </Button>
          <p className="text-center text-xs text-zinc-500">
            You will approve Matchr on LinkedIn, then come back here for step 2.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          <Button
            className="w-full"
            loading={busy === "linkedin"}
            disabled={busy !== null}
            onClick={() => void onConnect()}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Preview with sample data
          </Button>
          <Button variant="ghost" className="w-full" disabled={busy !== null} onClick={onSkip}>
            Skip to document upload
          </Button>
          <details className="rounded-xl border border-line bg-surface-muted px-3 py-2">
            <summary className="cursor-pointer text-xs font-medium text-zinc-700">
              Connect a real LinkedIn app instead
            </summary>
            <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-xs leading-5 text-zinc-600">
              <li>
                Create an app at{" "}
                <a
                  href="https://www.linkedin.com/developers/apps/new"
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-zinc-900 underline decoration-zinc-300 underline-offset-2"
                >
                  LinkedIn Developers
                </a>
                .
              </li>
              <li>
                Products → request{" "}
                <span className="font-medium">Sign in with LinkedIn using OpenID Connect</span>.
              </li>
              <li>
                Auth → Authorized redirect URLs → add
                <span className="mt-1 flex items-center gap-1.5">
                  <code className="block min-w-0 flex-1 truncate rounded-md border border-line bg-surface px-2 py-1 font-mono text-[11px] text-zinc-800">
                    {linkedinCallback}
                  </code>
                  <Button type="button" size="xs" variant="secondary" onClick={onCopy}>
                    {copied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </span>
              </li>
              <li>
                Paste Client ID and Secret into <code className="font-mono">Backend/.env</code>, then
                restart.
              </li>
            </ol>
          </details>
        </div>
      )}
    </div>
  );
}

function StepDocument({
  source,
  onSource,
  fileInput,
  dragging,
  setDragging,
  busy,
  nutrientConfigured,
  alreadyGrounded,
  canGoBack,
  onBack,
  onFinishWithoutUpload,
  onPickFile,
  onUpload,
}: {
  source: DocumentSource | null;
  onSource: (value: DocumentSource) => void;
  fileInput: RefObject<HTMLInputElement | null>;
  dragging: boolean;
  setDragging: (value: boolean) => void;
  busy: string | null;
  nutrientConfigured: boolean;
  alreadyGrounded: boolean;
  canGoBack: boolean;
  onBack: () => void;
  onFinishWithoutUpload: () => void;
  onPickFile: () => void;
  onUpload: (file: File | undefined) => Promise<void>;
}) {
  const accept =
    source === "linkedin-pdf" ? "application/pdf" : "application/pdf,text/plain,.txt,.md";

  return (
    <div>
      <input
        ref={fileInput}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => {
          void onUpload(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      <p className="text-sm leading-6 text-zinc-600">
        Choose how to import work history, then drop the file. Nutrient reads the document and maps
        experience, education, and skills into your profile.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <SourceChoice
          selected={source === "linkedin-pdf"}
          disabled={busy !== null}
          icon={<Link2 className="h-4 w-4" />}
          title="LinkedIn PDF"
          hint="More → Save to PDF"
          onClick={() => onSource("linkedin-pdf")}
        />
        <SourceChoice
          selected={source === "resume"}
          disabled={busy !== null}
          icon={<FileText className="h-4 w-4" />}
          title="Resume"
          hint="PDF or text file"
          onClick={() => onSource("resume")}
        />
      </div>

      {source ? (
        <div className="mt-4 animate-[var(--animate-slide-step)]">
          <p className="mb-2 text-xs leading-5 text-zinc-500">
            {source === "linkedin-pdf" ? (
              <>
                On LinkedIn: <span className="font-medium text-zinc-700">More → Save to PDF</span>.
                Drop that export here.
              </>
            ) : (
              <>Upload the resume you already have. PDF preferred; plain text works too.</>
            )}
          </p>
          <button
            type="button"
            disabled={busy !== null}
            onClick={onPickFile}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              void onUpload(event.dataTransfer.files?.[0]);
            }}
            className={cx(
              "flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-8 text-center transition-colors",
              dragging
                ? "border-brand-400 bg-brand-50/60"
                : "border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50",
              busy !== null && "cursor-not-allowed opacity-60",
            )}
          >
            <IconTile tone={dragging ? "brand" : "neutral"} size="lg">
              <FileUp className="h-4 w-4" />
            </IconTile>
            <span className="text-sm font-medium text-zinc-900">
              {busy === "resume"
                ? "Reading the document…"
                : source === "linkedin-pdf"
                  ? "Drop your LinkedIn PDF"
                  : "Drop your resume"}
            </span>
            <span className="text-xs text-zinc-500">
              {nutrientConfigured
                ? "Scanned pages are fine — Nutrient runs OCR."
                : "PDF or plain text. Scanned PDFs need a Nutrient API key for OCR."}
            </span>
          </button>
        </div>
      ) : (
        <p className="mt-3 text-xs text-zinc-500">Pick a source before uploading.</p>
      )}

      <div className="mt-4 flex items-center justify-between gap-2">
        {canGoBack ? (
          <Button variant="ghost" size="sm" disabled={busy !== null} onClick={onBack}>
            Back to LinkedIn
          </Button>
        ) : (
          <span />
        )}
        {alreadyGrounded ? (
          <Button variant="secondary" size="sm" disabled={busy !== null} onClick={onFinishWithoutUpload}>
            Finish without uploading
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function SourceChoice({
  selected,
  disabled,
  icon,
  title,
  hint,
  onClick,
}: {
  selected: boolean;
  disabled: boolean;
  icon: ReactNode;
  title: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cx(
        "rounded-xl border px-3 py-3.5 text-left transition-[border-color,background-color,box-shadow]",
        selected
          ? "border-brand-400 bg-brand-50/70 shadow-card ring-2 ring-brand-400/30"
          : "border-line bg-surface hover:border-zinc-300 hover:bg-zinc-50",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <IconTile tone={selected ? "brand" : "neutral"} size="sm">
        {icon}
      </IconTile>
      <p className="mt-2.5 text-sm font-medium text-zinc-900">{title}</p>
      <p className="mt-0.5 text-xs text-zinc-500">{hint}</p>
    </button>
  );
}

function SuccessBody() {
  return (
    <div className="flex flex-col items-center py-6 text-center">
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 animate-[var(--animate-pop)]">
        <CheckCircle2 className="h-7 w-7" />
      </span>
      <p className="mt-4 text-sm font-medium text-zinc-900">Integration step complete</p>
      <p className="mt-1 max-w-xs text-xs leading-5 text-zinc-500">
        Matching can now rank live roles against verified history. The cards on this page will
        show as done.
      </p>
    </div>
  );
}

function LinkedInMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="currentColor"
        d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"
      />
    </svg>
  );
}

export function GroundingStatus({
  linkedinConnected,
  linkedinSkipped,
  grounded,
  sources,
  onContinue,
  onOpenStep,
}: {
  linkedinConnected: boolean;
  linkedinSkipped: boolean;
  grounded: boolean;
  sources: string[];
  onContinue: () => void;
  onOpenStep: (step: WizardStep) => void;
}) {
  const step1Done = linkedinConnected || linkedinSkipped || (grounded && !linkedinConnected);
  const step2Done = grounded;
  const setupDone = step2Done;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Import sources
          </p>
          <p className="mt-0.5 text-sm text-zinc-600">
            {setupDone
              ? "Integration complete. Matchr is reading from verified sources."
              : "Sign in and import a document so matching has verified history to rank against."}
          </p>
        </div>
        {setupDone ? (
          <Badge tone="positive" dot>
            Setup complete
          </Badge>
        ) : (
          <Button size="sm" onClick={onContinue}>
            {step1Done ? "Continue setup" : "Get grounded"}
          </Button>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <StatusCard
          step={1}
          title="LinkedIn"
          done={step1Done}
          detail={
            linkedinConnected
              ? "Connected · identity imported"
              : linkedinSkipped || (grounded && !linkedinConnected)
                ? "Skipped · using a document instead"
                : "Sign in, or skip and upload a document"
          }
          onClick={step1Done && linkedinConnected ? undefined : () => onOpenStep(1)}
        />
        <StatusCard
          step={2}
          title="Career history"
          done={step2Done}
          detail={
            step2Done
              ? `Imported${sources.length ? ` via ${sources.join(", ")}` : ""}`
              : "LinkedIn PDF or resume — choose first, then upload"
          }
          onClick={step2Done ? undefined : () => onOpenStep(2)}
        />
      </div>
    </div>
  );
}

function StatusCard({
  step,
  title,
  done,
  detail,
  onClick,
}: {
  step: number;
  title: string;
  done: boolean;
  detail: string;
  onClick?: () => void;
}) {
  const interactive = Boolean(onClick);
  const Tag = interactive ? "button" : "div";
  return (
    <Tag
      {...(interactive ? { type: "button" as const } : {})}
      onClick={onClick}
      className={cx(
        "rounded-xl border p-4 text-left shadow-card transition-[border-color,background-color,box-shadow]",
        done
          ? "border-emerald-200 bg-emerald-50/50"
          : "border-line bg-surface",
        interactive && "hover:border-zinc-300 hover:shadow-panel",
      )}
    >
      <div className="flex min-w-0 items-start gap-2.5">
        <span
          className={cx(
            "mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
            done ? "bg-emerald-500 text-white" : "bg-zinc-100 text-zinc-500",
          )}
        >
          {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : step}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-zinc-900">
            Step {step} · {title}
          </p>
          <p className="mt-0.5 text-xs leading-5 text-zinc-500">{detail}</p>
        </div>
      </div>
    </Tag>
  );
}
