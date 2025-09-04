-- Add authoritative HALEU data sources
INSERT OR IGNORE INTO source(id, name, url, type) VALUES 
  ('doe-hub', 'DOE HALEU Allocation Hub', 'https://www.energy.gov/ne/us-department-energy-haleu-allocation-process', 'regulator'),
  ('doe-pr-r1', 'DOE PR Round 1', 'https://www.energy.gov/articles/us-department-energy-distribute-first-amounts-haleu-us-advanced-reactor-developers', 'regulator'),
  ('doe-pr-r2', 'DOE PR Round 2', 'https://www.energy.gov/articles/us-department-energy-distribute-next-round-haleu-us-nuclear-industry', 'regulator'),
  ('doe-pdf-process', 'DOE Allocation Process PDF', 'https://www.energy.gov/sites/default/files/2024-09/Final%20HALEU%20Allocation%20Process.pdf', 'regulator'),
  ('centrus-ir', 'Centrus Investors News', 'https://investors.centrusenergy.com/news-releases', 'vendor');
