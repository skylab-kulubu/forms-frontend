"use client";

import Link from "next/link";
import { LayoutTemplate, Plus } from "lucide-react";
import { Button, ListItem, ListPanel, Section } from "@skylab-kulubu/skylcn-ui";
import StateCard from "@/app/components/StateCard";
import { STARTER_TEMPLATES } from "../form-studio/studio-presets";
import { labelOf } from "./template-data";

export default function EmptyTemplates({ onAdopt, adopting }) {
  return (
    <StateCard title="Henüz şablonun yok" Icon={LayoutTemplate}
      description="Şablon, birçok formda sorduğun soruları bir arada tutar. Formda Şablon ekle menüsünden hepsini tek seferde eklersin."
    >
      <Button variant="primary" size="lg" render={<Link href="/admin/templates/new-template" />}>İlk şablonunu oluştur</Button>
      <Section level={3} title="Formlarda hazır duranlar" className="mt-10 w-full text-left">
        <ListPanel status={{ kind: "ready" }} framed={false} className="-mx-3">
          {STARTER_TEMPLATES.map((starter) => (
            <ListItem key={starter.id} title={starter.title} subtitle={starter.schema.map(labelOf).join(" · ")}
              trailing={
                <Button variant="ghost" size="sm" onClick={() => onAdopt(starter)} disabled={adopting}>
                  <Plus aria-hidden="true" />
                  Şablonlarıma ekle
                </Button>
              }
            />
          ))}
        </ListPanel>
      </Section>
    </StateCard>
  );
}
