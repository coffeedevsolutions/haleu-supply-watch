import type { ApiResponse } from '@hsw/shared';
import { api } from '@/lib/api';

interface Source {
  id: string;
  name: string;
  url: string;
  type: string;
}

async function getSourcesData(): Promise<Source[]> {
  try {
    const response = await api.getSources();
    return response.items || [];
  } catch (error) {
    console.error('Failed to fetch sources:', error);
    return [];
  }
}

export default async function DocumentsPage() {
  const sources = await getSourcesData();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Data Sources & Documents</h1>
            <p className="mt-1 text-sm text-gray-600">
              Authoritative sources used for HALEU allocation and delivery tracking
            </p>
          </div>

          <div className="p-6">
            {sources.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-lg">📄</div>
                <p className="mt-2 text-gray-500">No data sources found</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Regulatory Sources */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Government & Regulatory Sources
                  </h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {sources
                      .filter(source => source.type === 'regulator')
                      .map(source => (
                        <SourceCard key={source.id} source={source} />
                      ))}
                  </div>
                </div>

                {/* Vendor Sources */}
                {sources.some(s => s.type === 'vendor') && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                      Industry & Vendor Sources
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {sources
                        .filter(source => source.type === 'vendor')
                        .map(source => (
                          <SourceCard key={source.id} source={source} />
                        ))}
                    </div>
                  </div>
                )}

                {/* Other Sources */}
                {sources.some(s => !['regulator', 'vendor'].includes(s.type)) && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                      Other Sources
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {sources
                        .filter(source => !['regulator', 'vendor'].includes(source.type))
                        .map(source => (
                          <SourceCard key={source.id} source={source} />
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Data Ingest Information */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            📊 Data Ingestion Process
          </h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>
              <strong>Automated Updates:</strong> Worker cron jobs fetch DOE hub pages hourly.
            </p>
            <p>
              <strong>Heavy Processing:</strong> GitHub Actions run PDF parsing and rich HTML scraping hourly.
            </p>
            <p>
              <strong>Data Provenance:</strong> All raw artifacts are stored in R2 with timestamps and checksums.
            </p>
            <p>
              <strong>Source Priority:</strong> DOE sources are treated as authoritative; vendor sources provide corroboration.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SourceCard({ source }: { source: Source }) {
  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'regulator': return '🏛️';
      case 'vendor': return '🏭';
      default: return '📄';
    }
  };

  const getSourceTypeLabel = (type: string) => {
    switch (type) {
      case 'regulator': return 'Government';
      case 'vendor': return 'Industry';
      default: return 'Other';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-lg">{getSourceIcon(source.type)}</span>
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
              {getSourceTypeLabel(source.type)}
            </span>
          </div>
          
          <h3 className="text-sm font-semibold text-gray-900 mb-2">
            {source.name}
          </h3>
          
          <div className="space-y-2">
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              View Source
              <svg className="ml-1 w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
