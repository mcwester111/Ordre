import type { Metadata } from "next";
import SubPageHeader from "@/components/SubPageHeader";
import Footer from "@/components/Footer";
import LegalDocument, { type LegalContent } from "@/components/LegalDocument";
import DataControls from "@/components/DataControls";

export const metadata: Metadata = {
  title: `Privacy Policy — Ordre.`,
  description: "How Ordre collects, uses, shares, and protects your information.",
};

const PRIVACY: LegalContent = {
  title: `Privacy Policy`,
  updated: `9 July 2026`,
  intro: [
    {
      p: `This Privacy Policy explains how **Ordre** (**”Ordre,” “we,” “us,”** or **”our”**) collects, uses, shares, and protects information when you use Ordre, the AI stylist, together with its website, applications, and related services (the **”AI Stylist”**) — a private styling and curation atelier. It also describes the rights and choices you have over your information.`,
    },
    {
      p: `Ordre is designed to be **data-minimal by default.** You may use the AI Stylist without creating an account; if you do, your aesthetic profile is held only in your browser. If you create an account, your profile, stylist notes, and conversation history are stored on our servers so they follow you across devices. By using the AI Stylist, you agree to this Policy.`,
    },
  ],
  sections: [
    {
      title: `Information We Collect`,
      blocks: [
        { sub: "Information you provide" },
        {
          list: [
            `**Aesthetic profile.** The preferences you select or enter when building your profile (such as color world, contrast, era, form, and sensibility). For guests, this is stored locally in your browser. For account holders, it is stored on our servers and synced across devices.`,
            `**Content you submit.** The messages, descriptions, images, photographs, documents, and files you share with the curator so it can generate a response.`,
            `**Communications.** Information you provide when you contact us, give feedback, or request support, including your email address and the contents of your message.`,
            `**Account details.** If you create an account, we collect your name and email address. If paid plans are introduced, payment information will be processed by third-party payment providers.`,
          ],
        },
        { sub: "Information collected automatically" },
        {
          list: [
            `**Device and log data.** Basic technical information such as your IP address, browser type, device and operating system, and timestamps, generated when you interact with the AI Stylist.`,
            `**Usage information.** Limited information about how you interact with the AI Stylist, used to operate and improve it and to keep it secure.`,
            `**Local storage.** Small amounts of data stored in your browser (for example, your aesthetic profile and necessary preferences). See Section 7.`,
          ],
        },
        {
          p: `We do not intentionally collect special-category or sensitive personal information. Please do not submit such information unless it is necessary, and be mindful that images and documents you upload may contain more than you intend.`,
        },
      ],
    },
    {
      title: `How We Use Information`,
      blocks: [
        { p: "We use information for the following purposes:" },
        {
          list: [
            `To **provide the AI Stylist** — interpreting your prompts, images, and documents and generating styling guidance and curation;`,
            `To **personalize** your experience using your aesthetic profile;`,
            `To **operate, maintain, secure, and improve** the AI Stylist, including troubleshooting, analytics, and abuse prevention;`,
            `To **enforce rate limits and protect against fraud, abuse, and security threats**;`,
            `To **communicate** with you, including responding to inquiries and, where you have opted in, sending updates;`,
            `To **comply with legal obligations** and to establish, exercise, or defend legal claims.`,
          ],
        },
      ],
    },
    {
      title: `AI Processing & Third-Party Model Providers`,
      blocks: [
        {
          p: `The AI Stylist is powered by third-party artificial-intelligence providers (currently **Anthropic**). When you send a message, image, or document, **its contents are transmitted to the AI provider so a response can be generated.** This processing is essential to the AI Stylist.`,
        },
        {
          p: `The AI provider may retain the transmitted data for a limited period under its own policies — for example, to operate its services and to detect and prevent abuse and misuse. We contract with our providers to handle data responsibly, and reputable providers state that they **do not use business or API customer inputs and outputs to train their foundation models** absent specific consent; however, **the provider’s practices are governed by its own terms and privacy policy, and Ordre cannot access, control, or delete data held by the provider on your behalf.**`,
        },
        {
          p: `Output is generated by automated means and may be inaccurate. The AI Stylist does not make legal or similarly significant decisions about you, and the profiling it performs is limited to generating styling and aesthetic suggestions at your request. See Section 10 for your rights regarding automated processing.`,
        },
      ],
    },
    {
      title: `Legal Bases for Processing (EEA / UK)`,
      blocks: [
        {
          p: `If you are in the European Economic Area or the United Kingdom, we process your personal information on the following legal bases:`,
        },
        {
          list: [
            `**Performance of a contract** — to provide the AI Stylist you request;`,
            `**Consent** — for example, where you submit content to be processed by the AI provider, opt in to communications, or store optional data, which you may withdraw at any time;`,
            `**Legitimate interests** — to secure, maintain, and improve the AI Stylist and prevent abuse, balanced against your rights;`,
            `**Legal obligation** — to comply with applicable law.`,
          ],
        },
      ],
    },
    {
      title: `How We Share Information`,
      blocks: [
        { p: "**We do not sell your personal information.** We share information only as described below:" },
        {
          list: [
            `**AI providers** — to generate responses, as described in Section 3;`,
            `**Service providers / sub-processors** — vendors who help us host, operate, secure, analyze, and support the AI Stylist, bound by confidentiality and data-protection obligations;`,
            `**Payment processors** — if and when paid features are offered, to process transactions;`,
            `**Legal and safety** — where we believe in good faith that disclosure is required by law or legal process, or is necessary to protect the rights, property, or safety of Ordre, our users, or the public;`,
            `**Business transfers** — in connection with a merger, acquisition, financing, or sale of assets, in which case we will seek to ensure your information remains protected and will notify you of any material change.`,
          ],
        },
      ],
    },
    {
      title: `Cookies & Local Storage`,
      blocks: [
        {
          p: `The AI Stylist uses your browser’s local storage to hold your aesthetic profile and essential preferences so the curator can remember your taste between visits. If you create an account, Supabase (our authentication provider) sets a secure session cookie to keep you signed in across visits. We aim to keep the use of cookies and similar technologies to what is strictly necessary to operate the AI Stylist.`,
        },
        {
          p: `Where required by law, we will request your consent for any non-essential cookies or tracking technologies, and you can manage your choices through your browser settings. Disabling local storage may limit functionality, such as the ability to remember your profile.`,
        },
      ],
    },
    {
      title: `Data Retention`,
      blocks: [
        {
          p: `For guests, your aesthetic profile remains in your browser until you delete it or clear your browser storage, and conversations exist only within the active session. For account holders, your aesthetic profile, stylist notes, and conversation history are stored on our servers and retained until you delete your account. Account deletion is immediate and permanent — see Section 10.`,
        },
        {
          p: `Limited technical and log data may be retained for a short period for security and operational purposes. Data transmitted to AI providers is retained according to their policies, as described in Section 3. Where we retain any personal information, we keep it only as long as necessary for the purposes described in this Policy or as required by law.`,
        },
      ],
    },
    {
      title: `Data Security`,
      blocks: [
        {
          p: `We use reasonable technical and organizational measures designed to protect information against unauthorized access, loss, misuse, and alteration — including transport encryption, input validation and file-type restrictions on uploads, and rate limiting. **No method of transmission or storage is completely secure**, however, and we cannot guarantee absolute security. You are responsible for the security of the device and browser you use to access the AI Stylist.`,
        },
        {
          p: `In the event of a data breach that affects your personal information, we will notify affected users and relevant authorities as required by applicable law — including within 72 hours where required under GDPR, and within applicable timeframes under U.S. state breach-notification laws. Notification will be sent to the email address associated with your account.`,
        },
      ],
    },
    {
      title: `International Data Transfers`,
      blocks: [
        {
          p: `Ordre and its providers may process information in countries other than your own, including the United States, which may have different data-protection laws. Where we transfer personal information internationally, we rely on appropriate safeguards, such as the European Commission’s **Standard Contractual Clauses** or equivalent mechanisms, to protect your information.`,
        },
      ],
    },
    {
      title: `Your Rights & Choices`,
      blocks: [
        {
          p: `Depending on where you live, you may have some or all of the following rights regarding your personal information:`,
        },
        {
          list: [
            `**Access** — to know what personal information we hold about you and obtain a copy;`,
            `**Correction** — to have inaccurate information corrected;`,
            `**Deletion** — to request erasure of your personal information;`,
            `**Restriction and objection** — to limit or object to certain processing;`,
            `**Portability** — to receive certain information in a portable format;`,
            `**Withdraw consent** — where processing is based on consent, at any time, without affecting prior processing;`,
            `**Opt out of "sale” or “sharing"** — we do not sell or share your personal information for cross-context behavioral advertising;`,
            `**Non-discrimination** — you will not be treated differently for exercising your rights.`,
          ],
        },
        {
          p: `**You can delete your data at any time using the “Your Data” control below.** For guests, this removes your saved aesthetic profile from this browser immediately. For account holders, it permanently deletes your account, aesthetic profile, stylist notes, and conversation history from our servers — and is immediate and irreversible. This control does not affect data already transmitted to AI providers. To exercise any other right, or if you have questions, contact us using the details in Section 13. We will respond as required by applicable law and may need to verify your identity. **EEA/UK and certain other users also have the right to lodge a complaint with their local data-protection authority.**`,
        },
      ],
    },
    {
      id: `do-not-sell`,
      title: `U.S. State Privacy Rights`,
      blocks: [
        {
          p: `If you are a resident of California or another U.S. state with a comprehensive privacy law, you have the rights described in Section 10, including the rights to know, access, correct, and delete your personal information, and to opt out of the sale or sharing of personal information and of targeted advertising. **Ordre does not sell your personal information and does not share it for cross-context behavioral advertising.** You may exercise these rights as described above, and you may designate an authorized agent to act on your behalf where permitted by law.`,
        },
      ],
    },
    {
      title: `Children’s Privacy`,
      blocks: [
        {
          p: `The AI Stylist is not intended for, or directed to, children under 16, and we do not knowingly collect personal information from them. If you believe a child has provided us with personal information, please contact us and we will take appropriate steps to delete it.`,
        },
      ],
    },
    {
      title: `Changes to This Policy`,
      blocks: [
        {
          p: `We may update this Privacy Policy from time to time. When we make material changes, we will revise the "last updated" date above and, where appropriate, provide additional notice. Your continued use of the AI Stylist after the changes take effect indicates your acceptance of the updated Policy.`,
        },
      ],
    },
    {
      title: `Contact Us`,
      blocks: [
        {
          p: `If you have questions about this Privacy Policy or wish to exercise your rights, contact us at **contact@ordre.style**. If you are in the EEA or UK and we are required to designate a representative or data-protection contact, those details will be provided here.`,
        },
      ],
    },
  ],
};

export default function PrivacyPage() {
  return (
    <main className="relative min-h-screen flex flex-col">
      <SubPageHeader />

      <div style={{ flex: 1 }}>
        <LegalDocument content={PRIVACY} />

        {/* The interactive right-to-erasure control, kept directly beneath the
            policy so users can act on the rights described in Section 10. */}
        <div style={{ padding: "1rem 0 clamp(3rem, 8vh, 6rem)" }}>
          <DataControls />
        </div>
      </div>

      <Footer />
    </main>
  );
}
