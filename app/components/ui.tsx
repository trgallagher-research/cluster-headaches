"use client";
import type { ReactNode } from "react";

export function Chip(props: {
  on?: boolean;
  onClick: () => void;
  children: ReactNode;
  wide?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      className={"chip" + (props.on ? " on" : "") + (props.wide ? " wide" : "")}
      aria-pressed={props.on ?? false}
      aria-label={props.label}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  );
}

export function Field(props: { title: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="field">
      <h3 className="field-title">{props.title}</h3>
      <div className="chips">{props.children}</div>
      {props.hint ? <p className="hint">{props.hint}</p> : null}
    </div>
  );
}

export function SectionTitle(props: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="sec-title">
      <h2>{props.children}</h2>
      {props.right}
    </div>
  );
}

export function toggle<T>(list: T[], v: T): T[] {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}
