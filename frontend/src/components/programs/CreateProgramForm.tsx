"use client";

import { useState } from "react";

import { createProgram } from "@/lib/api";

type CreateProgramFormProps = {
  onChanged: () => Promise<void>;
};

export function CreateProgramForm({
  onChanged,
}: CreateProgramFormProps) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("active");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const tenantId = sessionStorage.getItem("tenant_id");

      if (!tenantId) {
        throw new Error("Tenant session missing.");
      }

      await createProgram({
        tenant_id: tenantId,
        name,
        code: code || null,
        description: description || null,
        status,
        start_date: startDate || null,
        end_date: endDate || null,
        metadata_json: null,
      });

      setName("");
      setCode("");
      setDescription("");
      setStatus("active");
      setStartDate("");
      setEndDate("");

      await onChanged();
    } catch (error) {
      console.error("Failed to create program:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to create program.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-5">
        <p className="text-sm font-medium text-slate-500">
          Program Management
        </p>

        <h3 className="mt-1 text-xl font-bold text-slate-950">
          Create Program
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Programs are used to scope documents, NCRs, CAPAs, and future
          access controls.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">
            Program Name
          </span>

          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="F-35 Modernization"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">
            Program Code
          </span>

          <input
            value={code}
            onChange={(event) => setCode(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="F35-MOD"
          />
        </label>

        <label className="block lg:col-span-2">
          <span className="text-sm font-medium text-slate-700">
            Description
          </span>

          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="Program description"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">
            Status
          </span>

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="active">active</option>
            <option value="on_hold">on_hold</option>
            <option value="closed">closed</option>
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">
            Start Date
          </span>

          <input
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">
            End Date
          </span>

          <input
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>

        <div className="lg:col-span-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Creating Program..." : "Create Program"}
          </button>
        </div>

        {errorMessage ? (
          <div className="lg:col-span-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}
      </form>
    </section>
  );
}