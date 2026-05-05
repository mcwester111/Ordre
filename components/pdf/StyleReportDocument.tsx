import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

/* ─── Types ──────────────────────────────────────────────────────────────── */

export type PaletteColor = {
  name: string;
  hex: string;
  role: string; // "Foundation" | "Accent" | "Statement" | "Neutral"
  note: string;
};

export type Combination = {
  name: string;
  colors: string[]; // hex values
  description: string;
};

export type ReportData = {
  palette: PaletteColor[];
  combinations: Combination[];
  brands: {
    luxury: string[];
    midLuxury: string[];
    affordable: string[];
  };
  styleNotes: string;
};

type Props = {
  portrait: string;
  figures: string[];
  reportData: ReportData;
  generatedDate: string;
};

/* ─── Tokens ─────────────────────────────────────────────────────────────── */

const DARK   = "#080705";
const DARK2  = "#0D0906";
const GOLD   = "#C9A84C";
const CREAM  = "#F0E6D0";
const DIM    = "#9A8B75";
const MUTED  = "#5C5040";

/* ─── Styles ─────────────────────────────────────────────────────────────── */

const s = StyleSheet.create({
  page: {
    backgroundColor: DARK,
    paddingHorizontal: 52,
    paddingTop: 52,
    paddingBottom: 44,
    color: CREAM,
  },

  /* Shared */
  rule: {
    height: 0.5,
    backgroundColor: GOLD,
    opacity: 0.4,
    marginVertical: 18,
  },
  ruleLight: {
    height: 0.5,
    backgroundColor: GOLD,
    opacity: 0.18,
    marginVertical: 12,
  },
  label: {
    fontFamily: "Helvetica",
    fontSize: 6.5,
    letterSpacing: 2.8,
    color: GOLD,
    opacity: 0.8,
    textTransform: "uppercase",
  },
  pageNumber: {
    fontFamily: "Helvetica",
    fontSize: 6,
    letterSpacing: 1.5,
    color: DIM,
    textAlign: "right",
    marginTop: 8,
  },

  /* ── Cover page ── */
  coverTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 6,
  },
  logoText: {
    fontFamily: "Times-BoldItalic",
    fontSize: 30,
    color: CREAM,
    letterSpacing: 3,
  },
  logoDot: {
    fontFamily: "Times-BoldItalic",
    fontSize: 16,
    color: GOLD,
  },
  eyebrow: {
    fontFamily: "Helvetica",
    fontSize: 6,
    letterSpacing: 3.5,
    color: GOLD,
    opacity: 0.7,
    textTransform: "uppercase",
    textAlign: "right",
    marginBottom: 2,
  },
  portrait: {
    fontFamily: "Times-Italic",
    fontSize: 13.5,
    lineHeight: 1.75,
    color: CREAM,
    marginBottom: 28,
  },
  figuresHeading: {
    fontFamily: "Helvetica",
    fontSize: 6.5,
    letterSpacing: 2.5,
    color: DIM,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  figureName: {
    fontFamily: "Times-Italic",
    fontSize: 12,
    color: GOLD,
    marginBottom: 7,
    letterSpacing: 0.4,
  },
  figureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  figureDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: GOLD,
    opacity: 0.7,
  },

  /* ── Section header shared ── */
  sectionTitle: {
    fontFamily: "Times-Italic",
    fontSize: 19,
    color: CREAM,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  sectionSub: {
    fontFamily: "Helvetica",
    fontSize: 7,
    letterSpacing: 2,
    color: DIM,
    textTransform: "uppercase",
    marginBottom: 20,
  },

  /* ── Palette ── */
  paletteGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  swatchCard: {
    width: "47%",
    marginBottom: 6,
  },
  swatchColor: {
    height: 64,
    borderRadius: 2,
    marginBottom: 8,
  },
  swatchRole: {
    fontFamily: "Helvetica",
    fontSize: 5.5,
    letterSpacing: 2,
    color: DIM,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  swatchName: {
    fontFamily: "Times-Italic",
    fontSize: 10.5,
    color: CREAM,
    marginBottom: 3,
  },
  swatchHex: {
    fontFamily: "Helvetica",
    fontSize: 6,
    color: MUTED,
    letterSpacing: 1,
    marginBottom: 5,
  },
  swatchNote: {
    fontFamily: "Helvetica",
    fontSize: 7,
    lineHeight: 1.55,
    color: DIM,
  },

  /* ── Combinations ── */
  comboCard: {
    marginBottom: 18,
    paddingBottom: 18,
  },
  comboChips: {
    flexDirection: "row",
    gap: 4,
    marginBottom: 10,
  },
  chip: {
    width: 28,
    height: 28,
    borderRadius: 2,
  },
  comboName: {
    fontFamily: "Times-Italic",
    fontSize: 11,
    color: CREAM,
    marginBottom: 5,
    letterSpacing: 0.3,
  },
  comboDesc: {
    fontFamily: "Helvetica",
    fontSize: 7.5,
    lineHeight: 1.6,
    color: DIM,
  },

  /* ── Brands ── */
  brandsGrid: {
    flexDirection: "row",
    gap: 16,
  },
  brandColumn: {
    flex: 1,
    backgroundColor: DARK2,
    padding: 16,
    borderRadius: 2,
  },
  brandTier: {
    fontFamily: "Helvetica",
    fontSize: 6,
    letterSpacing: 2.5,
    color: GOLD,
    opacity: 0.8,
    textTransform: "uppercase",
    marginBottom: 14,
  },
  brandName: {
    fontFamily: "Times-Italic",
    fontSize: 9.5,
    color: CREAM,
    marginBottom: 8,
    opacity: 0.85,
  },

  /* ── Style notes ── */
  styleNotes: {
    fontFamily: "Times-Italic",
    fontSize: 12,
    lineHeight: 1.8,
    color: CREAM,
    marginBottom: 28,
  },

  /* Footer */
  footer: {
    position: "absolute",
    bottom: 28,
    left: 52,
    right: 52,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerLogo: {
    fontFamily: "Times-BoldItalic",
    fontSize: 8,
    color: GOLD,
    opacity: 0.5,
    letterSpacing: 1.5,
  },
  footerDate: {
    fontFamily: "Helvetica",
    fontSize: 6,
    letterSpacing: 1.5,
    color: MUTED,
  },
});

/* ─── Sub-components ─────────────────────────────────────────────────────── */

function Footer({ date }: { date: string }) {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerLogo}>ORDRE.</Text>
      <Text style={s.footerDate}>{date}</Text>
    </View>
  );
}

function GoldRule() {
  return <View style={s.rule} />;
}

function LightRule() {
  return <View style={s.ruleLight} />;
}

/* ─── Pages ─────────────────────────────────────────────────────────────── */

function CoverPage({
  portrait,
  figures,
  date,
}: {
  portrait: string;
  figures: string[];
  date: string;
}) {
  return (
    <Page size="A4" style={s.page}>
      {/* Header */}
      <View style={s.coverTop}>
        <View>
          <Text style={s.logoText}>
            ORDRE<Text style={s.logoDot}>.</Text>
          </Text>
        </View>
        <View>
          <Text style={s.eyebrow}>Personal Style Report</Text>
          <Text style={[s.eyebrow, { opacity: 0.45, marginBottom: 0 }]}>
            Fashion Intelligence
          </Text>
        </View>
      </View>

      <GoldRule />

      {/* Portrait */}
      <Text style={[s.label, { marginBottom: 16 }]}>Your Portrait</Text>
      <Text style={s.portrait}>{portrait}</Text>

      <LightRule />

      {/* Figures */}
      {figures.length > 0 && (
        <View>
          <Text style={s.figuresHeading}>
            Those who may share your sensibility
          </Text>
          {figures.map((name, i) => (
            <View key={i} style={s.figureRow}>
              <View style={s.figureDot} />
              <Text style={s.figureName}>{name}</Text>
            </View>
          ))}
        </View>
      )}

      <Footer date={date} />
    </Page>
  );
}

function PalettePage({
  palette,
  date,
}: {
  palette: PaletteColor[];
  date: string;
}) {
  return (
    <Page size="A4" style={s.page}>
      <Text style={s.label}>Your Colour World</Text>
      <GoldRule />
      <Text style={s.sectionTitle}>The Palette</Text>
      <Text style={s.sectionSub}>
        Colours drawn from your profile and aesthetic direction
      </Text>

      <View style={s.paletteGrid}>
        {palette.map((color, i) => (
          <View key={i} style={s.swatchCard}>
            <View style={[s.swatchColor, { backgroundColor: color.hex }]} />
            <Text style={s.swatchRole}>{color.role}</Text>
            <Text style={s.swatchName}>{color.name}</Text>
            <Text style={s.swatchHex}>{color.hex}</Text>
            <Text style={s.swatchNote}>{color.note}</Text>
          </View>
        ))}
      </View>

      <Footer date={date} />
    </Page>
  );
}

function CombinationsPage({
  combinations,
  date,
}: {
  combinations: Combination[];
  date: string;
}) {
  return (
    <Page size="A4" style={s.page}>
      <Text style={s.label}>How to Wear It</Text>
      <GoldRule />
      <Text style={s.sectionTitle}>Colour Combinations</Text>
      <Text style={s.sectionSub}>
        Pairings drawn from your palette and form
      </Text>

      {combinations.map((combo, i) => (
        <View key={i} style={s.comboCard}>
          <View style={s.comboChips}>
            {combo.colors.map((hex, j) => (
              <View key={j} style={[s.chip, { backgroundColor: hex }]} />
            ))}
          </View>
          <Text style={s.comboName}>{combo.name}</Text>
          <Text style={s.comboDesc}>{combo.description}</Text>
          {i < combinations.length - 1 && <LightRule />}
        </View>
      ))}

      <Footer date={date} />
    </Page>
  );
}

function BrandsPage({
  brands,
  date,
}: {
  brands: ReportData["brands"];
  date: string;
}) {
  return (
    <Page size="A4" style={s.page}>
      <Text style={s.label}>Your Edit</Text>
      <GoldRule />
      <Text style={s.sectionTitle}>The Brand Directory</Text>
      <Text style={s.sectionSub}>
        Curated across three investment tiers
      </Text>

      <View style={s.brandsGrid}>
        {/* Luxury */}
        <View style={s.brandColumn}>
          <Text style={s.brandTier}>Luxury</Text>
          {brands.luxury.map((b, i) => (
            <Text key={i} style={s.brandName}>{b}</Text>
          ))}
        </View>

        {/* Mid-Luxury */}
        <View style={s.brandColumn}>
          <Text style={s.brandTier}>Mid-Luxury</Text>
          {brands.midLuxury.map((b, i) => (
            <Text key={i} style={s.brandName}>{b}</Text>
          ))}
        </View>

        {/* Affordable */}
        <View style={s.brandColumn}>
          <Text style={s.brandTier}>Affordable</Text>
          {brands.affordable.map((b, i) => (
            <Text key={i} style={s.brandName}>{b}</Text>
          ))}
        </View>
      </View>

      <Footer date={date} />
    </Page>
  );
}

function StyleNotesPage({
  styleNotes,
  date,
}: {
  styleNotes: string;
  date: string;
}) {
  return (
    <Page size="A4" style={s.page}>
      <Text style={s.label}>Your Direction</Text>
      <GoldRule />
      <Text style={s.sectionTitle}>The Style Notes</Text>
      <Text style={s.sectionSub}>
        A summary of your aesthetic language
      </Text>

      <Text style={s.styleNotes}>{styleNotes}</Text>

      <LightRule />

      <Text
        style={{
          fontFamily: "Helvetica",
          fontSize: 7,
          lineHeight: 1.6,
          color: MUTED,
          letterSpacing: 0.5,
        }}
      >
        This report was compiled by ordre., an AI fashion curator. It is
        personal to you and intended as a starting point for exploration, not a
        definitive prescription. Style evolves — return to refine it.
      </Text>

      <Footer date={date} />
    </Page>
  );
}

/* ─── Document ───────────────────────────────────────────────────────────── */

export default function StyleReportDocument({
  portrait,
  figures,
  reportData,
  generatedDate,
}: Props) {
  return (
    <Document
      title="Ordre. Personal Style Report"
      author="Ordre."
      subject="Personal Style Report"
    >
      <CoverPage portrait={portrait} figures={figures} date={generatedDate} />
      <PalettePage palette={reportData.palette} date={generatedDate} />
      <CombinationsPage combinations={reportData.combinations} date={generatedDate} />
      <BrandsPage brands={reportData.brands} date={generatedDate} />
      <StyleNotesPage styleNotes={reportData.styleNotes} date={generatedDate} />
    </Document>
  );
}
