(function() {
  'use strict';
  function initExtension() {
    if (typeof window.extensionsAPI === 'undefined') {
      setTimeout(initExtension, 500);
      return;
    }
    const extensionsAPI = window.extensionsAPI;
    function AppLinksComponent(props) {
      const application = props?.application || props?.item || props;
      const appName = application?.metadata?.name || application?.name || props?.name || '';
      const appNamespace = application?.metadata?.namespace || application?.namespace || props?.namespace || 'argocd';
      if (!appName) {
        return React.createElement('div', { style: { padding: '16px', color: '#666' } }, 'Application name not found');
      }
      const [links, setLinks] = React.useState({});
      const [loading, setLoading] = React.useState(true);
      const [error, setError] = React.useState(null);
      const [hoveredGroup, setHoveredGroup] = React.useState(null);
      React.useEffect(() => {
        if (!appName) {
          setLoading(false);
          return;
        }
      const fetchLinks = async () => {
        try {
          setLoading(true);
          setError(null);
          const headerValue = `${appNamespace}:${appName}`;
          const headers = new Headers();
          headers.set('Accept', 'application/json');
          headers.set('Argocd-Application-Name', headerValue);
          headers.set('Argocd-Project-Name', 'default');
          
          // Create abort controller for timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          try {
            // Call ArgoCD proxy extension (hardcoded proxy path)
            // ArgoCD will proxy this to https://postman-echo.com/get
            const response = await fetch(`/extensions/app-links-extension/get?appName=${encodeURIComponent(appName)}`, {
              method: 'GET',
              credentials: 'include',
              headers: headers,
              signal: controller.signal
            });
            clearTimeout(timeoutId);
            
            if (!response.ok) {
              // Server returned error status
              setError('offline');
              setLinks({});
              return;
            }
            const echoData = await response.json();
            // Extract app name from Postman Echo response (in args.appName)
            const echoAppName = echoData?.args?.appName || appName;
            
            // Generate links based on app name (mimicking server-side response)
            const data = {
              'Dashboard': [
                { label: 'Grafana Dashboard', url: `https://grafana.example.com/dashboard/${echoAppName}` },
                { label: 'Custom Dashboard', url: `https://custom.example.com/dash/${echoAppName}` },
                { label: 'Overview Dashboard', url: `https://overview.example.com/app/${echoAppName}` }
              ],
              'Logs': [
                { label: 'Kibana Logs', url: `https://kibana.example.com/logs/${echoAppName}` },
                { label: 'CloudWatch Logs', url: `https://cloudwatch.example.com/logs/${echoAppName}` },
                { label: 'Application Logs', url: `https://logs.example.com/app/${echoAppName}` }
              ],
              'Metrics': [
                { label: 'Prometheus Metrics', url: `https://prometheus.example.com/metrics/${echoAppName}` },
                { label: 'Datadog Metrics', url: `https://datadog.example.com/metrics/${echoAppName}` }
              ],
              'Documentation': [
                { label: 'API Docs', url: `https://docs.example.com/api/${echoAppName}` },
                { label: 'Runbook', url: `https://runbook.example.com/${echoAppName}` }
              ]
            };
            setLinks(data);
          } catch (fetchErr) {
            clearTimeout(timeoutId);
            throw fetchErr;
          }
        } catch (err) {
          // Network error, timeout, or other fetch failure
          // Silently handle - don't crash ArgoCD
          setError('offline');
          setLinks({});
        } finally {
          setLoading(false);
        }
      };
        fetchLinks();
      }, [appName, appNamespace]);
      const entries = Object.entries(links);
      const hasData = entries.length > 0 && !error;
      
      // Bee logo SVG (inline) - Friendly bee with Glue Ops bottle
      const beeLogo = React.createElement('svg', {
        width: '36',
        height: '36',
        viewBox: '0 0 120 120',
        style: { verticalAlign: 'middle', marginRight: '10px', flexShrink: 0 }
      },
        // Bee head (yellow circle)
        React.createElement('circle', { cx: '50', cy: '40', r: '18', fill: '#FFD700', stroke: '#000', strokeWidth: '2.5' }),
        // Bee eyes
        React.createElement('circle', { cx: '45', cy: '38', r: '4', fill: '#000' }),
        React.createElement('circle', { cx: '55', cy: '38', r: '4', fill: '#000' }),
        // Bee smile
        React.createElement('path', { d: 'M 42 48 Q 50 52 58 48', stroke: '#000', strokeWidth: '2', fill: 'none', strokeLinecap: 'round' }),
        // Bee antennae
        React.createElement('line', { x1: '45', y1: '25', x2: '42', y2: '18', stroke: '#000', strokeWidth: '2', strokeLinecap: 'round' }),
        React.createElement('line', { x1: '55', y1: '25', x2: '58', y2: '18', stroke: '#000', strokeWidth: '2', strokeLinecap: 'round' }),
        React.createElement('circle', { cx: '42', cy: '18', r: '2', fill: '#000' }),
        React.createElement('circle', { cx: '58', cy: '18', r: '2', fill: '#000' }),
        // Bee body (yellow with black stripe)
        React.createElement('ellipse', { cx: '50', cy: '65', rx: '16', ry: '20', fill: '#FFD700', stroke: '#000', strokeWidth: '2.5' }),
        React.createElement('ellipse', { cx: '50', cy: '65', rx: '16', ry: '8', fill: '#000' }),
        // Bee wings (transparent with outline)
        React.createElement('ellipse', { cx: '38', cy: '55', rx: '8', ry: '12', fill: 'rgba(255,255,255,0.3)', stroke: '#000', strokeWidth: '1.5' }),
        React.createElement('ellipse', { cx: '62', cy: '55', rx: '8', ry: '12', fill: 'rgba(255,255,255,0.3)', stroke: '#000', strokeWidth: '1.5' }),
        // Glue Ops bottle (held by bee)
        React.createElement('rect', { x: '70', y: '50', width: '20', height: '35', rx: '3', fill: '#FFD700', stroke: '#000', strokeWidth: '2' }),
        React.createElement('rect', { x: '75', y: '45', width: '10', height: '8', rx: '2', fill: '#666', stroke: '#000', strokeWidth: '1.5' }),
        React.createElement('text', { x: '80', y: '75', fontSize: '7', fill: '#000', textAnchor: 'middle', fontWeight: 'bold', fontFamily: 'Arial, sans-serif' }, 'Glue'),
        React.createElement('text', { x: '80', y: '82', fontSize: '7', fill: '#000', textAnchor: 'middle', fontWeight: 'bold', fontFamily: 'Arial, sans-serif' }, 'Ops')
      );
      
      // Category icons (using Unicode/emoji for simplicity)
      const categoryIcons = {
        'Dashboard': '📊',
        'Logs': '📋',
        'Metrics': '📈',
        'Documentation': '📚'
      };
      
      return React.createElement('div', { 
        style: { 
          padding: '20px',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e0e0e0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        } 
      },
        React.createElement('div', { 
          style: { 
            display: 'flex',
            alignItems: 'center',
            marginBottom: '16px',
            paddingBottom: '12px',
            borderBottom: '2px solid #f0f0f0'
          } 
        },
          beeLogo,
          React.createElement('h3', { 
            style: { 
              margin: 0,
              fontSize: '18px',
              fontWeight: 700,
              color: '#1a1a1a',
              letterSpacing: '-0.3px'
            } 
          }, 'GlueOps')
        ),
        loading ? React.createElement('div', { 
          style: { 
            textAlign: 'center', 
            color: '#666', 
            padding: '24px 0',
            fontSize: '14px'
          } 
        }, '⏳ Loading links...') :
        !hasData ? React.createElement('div', { 
          style: { 
            textAlign: 'center', 
            color: '#999', 
            padding: '24px 0',
            fontSize: '14px'
          } 
        }, '📭 No links available') :
        React.createElement('div', { 
          style: { 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '10px',
            position: 'relative'
          } 
        },
          entries.map(([groupLabel, linkArray], groupIdx) => {
            const links = Array.isArray(linkArray) ? linkArray : [{ label: groupLabel, url: linkArray }];
            const isHovered = hoveredGroup === groupIdx;
            const icon = categoryIcons[groupLabel] || '🔗';
            const isSingleLink = links.length === 1;
            
            return React.createElement('div', {
              key: groupIdx,
              style: { position: 'relative' },
              onMouseEnter: () => setHoveredGroup(groupIdx),
              onMouseLeave: () => setHoveredGroup(null)
            }, 
              isSingleLink ? React.createElement('a', {
                href: typeof links[0] === 'string' ? links[0] : links[0].url,
                target: '_blank',
                rel: 'noopener noreferrer',
                style: {
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  backgroundColor: isHovered ? '#f8f9fa' : '#ffffff',
                  border: `1px solid ${isHovered ? '#d0d7de' : '#e1e4e8'}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#24292f',
                  transition: 'all 0.2s ease',
                  textDecoration: 'none',
                  boxShadow: isHovered ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                }
              },
                React.createElement('span', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
                  React.createElement('span', { style: { fontSize: '16px' } }, icon),
                  React.createElement('span', {}, typeof links[0] === 'string' ? groupLabel : links[0].label || groupLabel)
                ),
                React.createElement('span', { style: { fontSize: '12px', color: '#656d76' } }, '→')
              ) :
              React.createElement('div', {
                style: {
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  backgroundColor: isHovered ? '#f8f9fa' : '#ffffff',
                  border: `1px solid ${isHovered ? '#d0d7de' : '#e1e4e8'}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#24292f',
                  transition: 'all 0.2s ease',
                  boxShadow: isHovered ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                }
              },
                React.createElement('span', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
                  React.createElement('span', { style: { fontSize: '16px' } }, icon),
                  React.createElement('span', {}, groupLabel)
                ),
                React.createElement('span', { style: { fontSize: '10px', color: '#656d76', transform: isHovered ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' } }, '▼')
              ),
              isHovered && !isSingleLink && links.length > 1 && React.createElement('div', {
                style: {
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '6px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #d0d7de',
                  borderRadius: '6px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  zIndex: 1000,
                  padding: '4px 0',
                  overflow: 'hidden'
                }
              },
                links.map((link, linkIdx) =>
                  React.createElement('a', {
                    key: linkIdx,
                    href: typeof link === 'string' ? link : link.url,
                    target: '_blank',
                    rel: 'noopener noreferrer',
                    style: {
                      display: 'block',
                      padding: '10px 14px',
                      textDecoration: 'none',
                      color: '#24292f',
                      fontSize: '13px',
                      transition: 'background-color 0.15s',
                      borderBottom: linkIdx < links.length - 1 ? '1px solid #f0f0f0' : 'none'
                    },
                    onMouseEnter: (e) => { e.target.style.backgroundColor = '#f6f8fa'; },
                    onMouseLeave: (e) => { e.target.style.backgroundColor = 'transparent'; }
                  }, typeof link === 'string' ? link : link.label || link.url)
                )
              )
            );
          })
        )
      );
    }
    if (typeof extensionsAPI.registerStatusPanelExtension === 'function') {
      extensionsAPI.registerStatusPanelExtension(AppLinksComponent, 'GlueOps', 'glueops');
    }
    if (typeof extensionsAPI.registerAppViewExtension === 'function') {
      extensionsAPI.registerAppViewExtension(AppLinksComponent, 'GlueOps', 'fa-link');
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initExtension);
  } else {
    initExtension();
  }
})();
