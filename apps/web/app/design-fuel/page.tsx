import designFuelData from '../../data/design_fuel.json';

// Server component that loads static data
export default function DesignFuelPage() {
  const { reactorDesigns, fuelForms, enrichmentCategories } = designFuelData;

  // Create a matrix of which designs support which fuel forms
  const createMatrix = () => {
    const allFuelForms = Object.keys(fuelForms);
    const matrix: { [design: string]: { [fuelForm: string]: boolean } } = {};
    
    reactorDesigns.forEach(design => {
      matrix[design.name] = {};
      allFuelForms.forEach(fuelForm => {
        matrix[design.name][fuelForm] = design.allowedFuelForms.includes(fuelForm);
      });
    });
    
    return { matrix, allFuelForms };
  };

  const { matrix, allFuelForms } = createMatrix();

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Reactor Design ↔ Fuel Form Matrix</h1>
      
      <p style={{ marginBottom: '2rem', color: '#6b7280' }}>
        Compatibility matrix showing which reactor designs can use which HALEU fuel forms.
      </p>

      {/* Legend */}
      <div style={{ 
        marginBottom: '2rem',
        padding: '1rem',
        backgroundColor: '#f0f9ff',
        borderRadius: '0.5rem',
        border: '1px solid #0ea5e9'
      }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: '600' }}>
          Fuel Form Definitions
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '0.5rem' }}>
          {Object.entries(fuelForms).map(([form, description]) => (
            <div key={form}>
              <strong>{form}:</strong> {description}
            </div>
          ))}
        </div>
      </div>

      {/* Enrichment Categories */}
      <div style={{ 
        marginBottom: '2rem',
        padding: '1rem',
        backgroundColor: '#fefce8',
        borderRadius: '0.5rem',
        border: '1px solid #eab308'
      }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: '600' }}>
          Enrichment Categories
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '0.5rem' }}>
          {Object.entries(enrichmentCategories).map(([category, description]) => (
            <div key={category}>
              <strong>{category}:</strong> {description}
            </div>
          ))}
        </div>
      </div>

      {/* Compatibility Matrix */}
      <div style={{ overflowX: 'auto', marginBottom: '2rem' }}>
        <table style={{ 
          width: '100%',
          borderCollapse: 'collapse',
          border: '1px solid #e5e7eb',
          backgroundColor: 'white'
        }}>
          <thead style={{ backgroundColor: '#f9fafb' }}>
            <tr>
              <th style={{ 
                border: '1px solid #e5e7eb', 
                padding: '1rem', 
                textAlign: 'left',
                fontSize: '0.875rem',
                fontWeight: '600',
                minWidth: '200px'
              }}>
                Reactor Design
              </th>
              {allFuelForms.map(fuelForm => (
                <th 
                  key={fuelForm}
                  style={{ 
                    border: '1px solid #e5e7eb', 
                    padding: '1rem', 
                    textAlign: 'center',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    minWidth: '100px'
                  }}
                >
                  {fuelForm}
                </th>
              ))}
              <th style={{ 
                border: '1px solid #e5e7eb', 
                padding: '1rem', 
                textAlign: 'left',
                fontSize: '0.875rem',
                fontWeight: '600',
                minWidth: '150px'
              }}>
                Enrichment Range
              </th>
            </tr>
          </thead>
          <tbody>
            {reactorDesigns.map(design => (
              <tr key={design.name}>
                <td style={{ 
                  border: '1px solid #e5e7eb', 
                  padding: '1rem',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}>
                  <div>
                    <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                      {design.name}
                    </div>
                    <div style={{ 
                      fontSize: '0.75rem', 
                      color: '#6b7280',
                      backgroundColor: '#f3f4f6',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      display: 'inline-block'
                    }}>
                      {design.type}
                    </div>
                  </div>
                </td>
                {allFuelForms.map(fuelForm => (
                  <td 
                    key={fuelForm}
                    style={{ 
                      border: '1px solid #e5e7eb', 
                      padding: '1rem',
                      textAlign: 'center',
                      backgroundColor: matrix[design.name][fuelForm] ? '#dcfce7' : '#fef2f2'
                    }}
                  >
                    {matrix[design.name][fuelForm] ? (
                      <span style={{ color: '#166534', fontSize: '1.25rem' }}>✓</span>
                    ) : (
                      <span style={{ color: '#dc2626', fontSize: '1.25rem' }}>✗</span>
                    )}
                  </td>
                ))}
                <td style={{ 
                  border: '1px solid #e5e7eb', 
                  padding: '1rem',
                  fontSize: '0.875rem'
                }}>
                  {design.enrichmentLevels.join(', ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detailed Design Information */}
      <div>
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: '600' }}>
          Reactor Design Details
        </h2>
        
        <div style={{ display: 'grid', gap: '1rem' }}>
          {reactorDesigns.map(design => (
            <div 
              key={design.name}
              style={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                padding: '1.5rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600' }}>
                  {design.name}
                </h3>
                <span style={{
                  padding: '0.25rem 0.75rem',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  borderRadius: '0.25rem',
                  fontSize: '0.75rem',
                  fontWeight: '500'
                }}>
                  {design.type}
                </span>
              </div>
              
              <p style={{ 
                margin: '0 0 1rem 0', 
                color: '#6b7280',
                fontSize: '0.875rem'
              }}>
                {design.notes}
              </p>
              
              <div style={{ display: 'flex', gap: '2rem', fontSize: '0.875rem' }}>
                <div>
                  <strong>Allowed Fuel Forms:</strong>
                  <div style={{ marginTop: '0.25rem' }}>
                    {design.allowedFuelForms.map(form => (
                      <span 
                        key={form}
                        style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.5rem',
                          backgroundColor: '#dcfce7',
                          color: '#166534',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          marginRight: '0.5rem'
                        }}
                      >
                        {form}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <strong>Enrichment Levels:</strong>
                  <div style={{ marginTop: '0.25rem' }}>
                    {design.enrichmentLevels.map(level => (
                      <span 
                        key={level}
                        style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.5rem',
                          backgroundColor: '#fef3c7',
                          color: '#92400e',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          marginRight: '0.5rem'
                        }}
                      >
                        {level}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
