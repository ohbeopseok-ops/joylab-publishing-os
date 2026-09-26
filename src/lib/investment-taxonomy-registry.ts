import registry from '../data/investment-taxonomy-registry-v1.json';
import taxonomy from '../../config/investment-taxonomy-v1.json';

export type InvestmentTaxonomyRecord = (typeof registry.records)[number];

const bySlug = new Map(registry.records.map((record) => [record.slug, record]));
const industryLabels = new Map(taxonomy.industries.map((item) => [item.id, item.label]));
const thesisLabels = new Map(taxonomy.theses.map((item) => [item.id, item.label]));

export function getInvestmentTaxonomy(slug: string): InvestmentTaxonomyRecord {
  return bySlug.get(slug) ?? { slug, route: '/articles/' + slug, industries: [], theses: [], companies: [] };
}

export function getInvestmentSearchTerms(slug: string): string[] {
  const record = getInvestmentTaxonomy(slug);
  return [
    ...record.industries,
    ...record.industries.map((id) => industryLabels.get(id) ?? id),
    ...record.theses,
    ...record.theses.map((id) => thesisLabels.get(id) ?? id),
    ...record.companies
  ];
}

export function investmentTaxonomyOverlapScore(aSlug: string, bSlug: string): number {
  const a = getInvestmentTaxonomy(aSlug);
  const b = getInvestmentTaxonomy(bSlug);
  const overlap = (left: string[], right: string[]) => left.filter((item) => right.includes(item)).length;
  return overlap(a.industries, b.industries) * 4 + overlap(a.theses, b.theses) * 5 + overlap(a.companies, b.companies) * 7;
}

export function industryCoverage(id: string): number {
  return registry.records.filter((record) => record.industries.includes(id as never)).length;
}

export function thesisCoverage(id: string): number {
  return registry.records.filter((record) => record.theses.includes(id as never)).length;
}

export { registry, taxonomy };
