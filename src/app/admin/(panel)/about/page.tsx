import Link from "next/link";
import { Card, PageTitle, SavedNotice } from "@/components/admin/Card";
import { inputClass, labelClass } from "@/components/admin/styles";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { SubmitButton } from "@/components/admin/ui";
import { imageSizeHint } from "@/lib/image-sizes";
import { getSettings } from "@/lib/settings";
import { saveAboutAction } from "../../actions";

export default async function AboutAdmin({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const [s, sp] = await Promise.all([getSettings(), searchParams]);
  const values = [
    { n: 1, title: s.aboutValue1Title, text: s.aboutValue1Text },
    { n: 2, title: s.aboutValue2Title, text: s.aboutValue2Text },
    { n: 3, title: s.aboutValue3Title, text: s.aboutValue3Text },
  ];

  return (
    <>
      <PageTitle title="About page" description="The story, mission and vision behind TruthPitch, shown on /about. Sections appear in this order on the page." />
      <SavedNotice show={sp.saved === "1"}>About page saved.</SavedNotice>

      <form action={saveAboutAction} className="grid gap-6">
        <Card title="Intro">
          <div className="grid gap-4">
            <div>
              <label className={labelClass} htmlFor="aboutTitle">
                Small label above the intro
              </label>
              <input id="aboutTitle" name="aboutTitle" defaultValue={s.aboutTitle} className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="aboutIntro">
                Intro statement (large text)
              </label>
              <textarea id="aboutIntro" name="aboutIntro" defaultValue={s.aboutIntro} rows={2} className={inputClass} />
              <p className="mt-1 text-xs text-neutral-500">One or two sentences that sum up TruthPitch.</p>
            </div>
          </div>
        </Card>

        <Card title="Mission & vision">
          <p className="mb-4 text-sm text-neutral-600">Shown side by side under the intro. Empty the text of one to hide it.</p>
          <div className="grid gap-6 md:grid-cols-2">
            {[
              { key: "Mission", title: s.aboutMissionTitle, text: s.aboutMissionText },
              { key: "Vision", title: s.aboutVisionTitle, text: s.aboutVisionText },
            ].map((b) => (
              <div key={b.key} className="grid content-start gap-3">
                <div>
                  <label className={labelClass} htmlFor={`about${b.key}Title`}>
                    {`${b.key}: heading`}
                  </label>
                  <input id={`about${b.key}Title`} name={`about${b.key}Title`} defaultValue={b.title} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass} htmlFor={`about${b.key}Text`}>
                    {`${b.key}: text`}
                  </label>
                  <textarea id={`about${b.key}Text`} name={`about${b.key}Text`} defaultValue={b.text} rows={6} className={inputClass} />
                  <p className="mt-1 text-xs text-neutral-500">An empty line starts a new paragraph. The first paragraph is shown larger.</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Why I started TruthPitch">
          <div className="grid gap-4">
            <div>
              <label className={labelClass} htmlFor="aboutStoryTitle">
                Heading
              </label>
              <input id="aboutStoryTitle" name="aboutStoryTitle" defaultValue={s.aboutStoryTitle} className={inputClass} />
            </div>
            <div>
              <p className={labelClass}>Personal story</p>
              <RichTextEditor name="aboutStoryText" label="Personal story" defaultValue={s.aboutStoryText} minHeight={320} />
              <p className="mt-1 text-xs text-neutral-500">Leave empty to hide this section.</p>
            </div>
            <div>
              <label className={labelClass} htmlFor="aboutStorySignoff">
                Closing line (large, bold)
              </label>
              <input id="aboutStorySignoff" name="aboutStorySignoff" defaultValue={s.aboutStorySignoff} className={inputClass} />
            </div>
          </div>
        </Card>

        <Card title="The idea">
          <div className="grid gap-4">
            <div>
              <p className={labelClass}>Story</p>
              <RichTextEditor name="aboutText" label="About story" defaultValue={s.aboutText} minHeight={260} />
              <p className="mt-1 text-xs text-neutral-500">Why TruthPitch exists and what it stands for.</p>
            </div>
            <div>
              <label className={labelClass} htmlFor="aboutImageUrl">
                Image URL (optional)
              </label>
              <input id="aboutImageUrl" name="aboutImageUrl" defaultValue={s.aboutImageUrl} placeholder="/media/… or https://…" className={inputClass} />
              <p className="mt-1 text-xs text-neutral-500">Shown next to the story. Upload one under Media, then paste its URL here. {imageSizeHint("about")}</p>
            </div>
          </div>
        </Card>

        <Card title="What we stand for">
          <p className="mb-4 text-sm text-neutral-600">Up to three short principles. Leave both fields empty to hide one.</p>
          <div className="grid gap-6 md:grid-cols-3">
            {values.map((v) => (
              <div key={v.n} className="grid content-start gap-3">
                <div>
                  <label className={labelClass} htmlFor={`aboutValue${v.n}Title`}>
                    {`Principle ${v.n}`}
                  </label>
                  <input id={`aboutValue${v.n}Title`} name={`aboutValue${v.n}Title`} defaultValue={v.title} className={inputClass} />
                </div>
                <textarea
                  name={`aboutValue${v.n}Text`}
                  aria-label={`Principle ${v.n} text`}
                  defaultValue={v.text}
                  rows={4}
                  className={inputClass}
                />
              </div>
            ))}
          </div>
        </Card>

        <div className="flex items-center gap-4">
          <SubmitButton>Save About page</SubmitButton>
          <Link href="/about" target="_blank" className="text-sm text-neutral-600 underline underline-offset-4 hover:text-black">
            View page
          </Link>
        </div>
      </form>
    </>
  );
}
