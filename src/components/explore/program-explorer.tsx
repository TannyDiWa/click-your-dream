"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Combobox, type ComboOption } from "@/components/explore/combobox";
import { ProgramCard } from "@/components/explore/program-card";
import { TCAS_YEAR } from "@/lib/tcas/subjects";
import type { TcasIndex, TcasProgram, TcasUniversity } from "@/lib/tcas/types";

/** "ภาษาไทย ปกติ • วิทยาเขตหลัก • รอบ 3 รับ 250 คน" */
function programMeta(p: TcasProgram) {
  return [p.type, p.campus, p.seats["3"] ? `รอบ 3 รับ ${p.seats["3"]} คน` : "ไม่เปิดรอบ 3"].filter(Boolean).join(" • ");
}

/** Program ids start with "1" + the 3-digit university id, e.g. 10010121300001A → 001. */
const universityOf = (programId: string) => programId.slice(1, 4);

/** University → faculty → program pickers; the chosen program is kept in ?program= so it can be shared. */
export function ProgramExplorer({ universities }: { universities: TcasIndex["universities"] }) {
  const params = useSearchParams();
  const programId = params.get("program") ?? "";

  // The program in the URL decides the university and faculty, so links and back/forward work;
  // the picked values only count while no program is chosen (picking one clears ?program=).
  const [pickedUni, setPickedUni] = useState("");
  const [pickedFaculty, setPickedFaculty] = useState("");
  const [files, setFiles] = useState<Record<string, TcasUniversity>>({});
  const [error, setError] = useState<string | null>(null);
  const uniId = programId ? universityOf(programId) : pickedUni;
  const data = files[uniId];

  useEffect(() => {
    if (!uniId || files[uniId]) return;
    let cancelled = false;
    fetch(`/tcas/${TCAS_YEAR}/${uniId}.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<TcasUniversity>;
      })
      .then((u) => {
        if (!cancelled) setFiles((f) => ({ ...f, [u.id]: u }));
      })
      .catch(() => {
        if (!cancelled) setError("โหลดข้อมูลหลักสูตรไม่สำเร็จ ลองเลือกใหม่อีกครั้ง");
      });
    return () => {
      cancelled = true;
    };
  }, [uniId, files]);

  const programFaculty = programId ? data?.faculties.find((f) => f.programs.some((p) => p.id === programId)) : undefined;
  const shownFaculty = programFaculty ?? data?.faculties.find((f) => f.name === pickedFaculty);
  const program = shownFaculty?.programs.find((p) => p.id === programId);

  const uniOptions: ComboOption[] = universities.map((u) => ({ value: u.id, label: u.name, meta: `${u.programs} หลักสูตร` }));
  const facultyOptions: ComboOption[] = (data?.faculties ?? []).map((f) => ({ value: f.name, label: f.name, meta: `${f.programs.length} หลักสูตร` }));
  // Without a faculty, every program of the university is searchable, grouped by faculty.
  const programOptions: ComboOption[] = (shownFaculty ? [shownFaculty] : (data?.faculties ?? [])).flatMap((f) =>
    f.programs.map((p) => ({ value: p.id, label: p.name, meta: programMeta(p), ...(shownFaculty ? {} : { group: f.name }) })),
  );

  function setProgram(id: string) {
    const url = new URL(window.location.href);
    if (id) url.searchParams.set("program", id);
    else url.searchParams.delete("program");
    window.history.replaceState(null, "", url);
  }

  return (
    <>
      <div className="grid gap-4 rounded-[28px] border border-white bg-paper p-5 shadow-[0_10px_30px_rgba(123,135,184,0.1)] sm:p-6 lg:grid-cols-3">
        <Combobox
          label="1. มหาวิทยาลัย"
          placeholder="พิมพ์ชื่อมหาวิทยาลัย"
          unit="มหาวิทยาลัย"
          options={uniOptions}
          value={uniId}
          onChange={(id) => {
            setError(null);
            setPickedUni(id);
            setPickedFaculty("");
            setProgram("");
          }}
        />
        <Combobox
          label="2. คณะ"
          placeholder={uniId ? "พิมพ์ชื่อคณะ (ไม่เลือกก็ได้)" : "เลือกมหาวิทยาลัยก่อน"}
          unit="คณะ"
          options={facultyOptions}
          value={shownFaculty?.name ?? ""}
          disabled={!data}
          loading={Boolean(uniId && !data && !error)}
          onChange={(name) => {
            setPickedUni(uniId);
            setPickedFaculty(name);
            setProgram("");
          }}
        />
        <Combobox
          label="3. สาขาและหลักสูตร"
          placeholder={data ? "พิมพ์ชื่อสาขา เช่น คอมพิวเตอร์" : "เลือกมหาวิทยาลัยก่อน"}
          unit="หลักสูตร"
          options={programOptions}
          value={program?.id ?? ""}
          disabled={!data}
          loading={Boolean(uniId && !data && !error)}
          onChange={(id) => {
            setPickedUni(uniId);
            setProgram(id);
          }}
        />
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-2xl bg-[#fdeef5] px-4 py-3 text-sm text-[#b04b82]">
          {error}
        </p>
      )}

      {program && data && shownFaculty ? (
        <ProgramCard key={program.id} program={program} university={data.name} faculty={shownFaculty.name} />
      ) : (
        <p className="mt-5 text-center text-[15px] text-muted">
          เลือกหลักสูตร แล้วจะเห็นวิชาที่ต้องสมัครสอบ สัดส่วนคะแนน วันสอบ และจำนวนที่รับของแต่ละรอบ
        </p>
      )}
    </>
  );
}
