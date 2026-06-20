import { nanoid } from "nanoid";

export function patientId() {
  return `pat_${nanoid(10)}`;
}

export function chartId() {
  return `chart_${nanoid(10)}`;
}

export function referralId() {
  return `ref_${nanoid(10)}`;
}

export function specialistId() {
  return `spec_${nanoid(10)}`;
}

export function genericId() {
  return nanoid(16);
}
