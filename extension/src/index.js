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
      
      return React.createElement('div', { style: { padding: '16px' } },
        React.createElement('h3', { style: { marginTop: 0, marginBottom: '12px', fontSize: '16px', fontWeight: 600 } }, 'GlueOps'),
        loading ? React.createElement('div', { style: { textAlign: 'center', color: '#666', padding: '8px 0' } }, 'Loading...') :
        !hasData ? React.createElement('div', { style: { textAlign: 'center', color: '#666', padding: '8px 0' } }, 'No Data. Refresh Page') :
        React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative' } },
          entries.map(([groupLabel, linkArray], groupIdx) => {
            const links = Array.isArray(linkArray) ? linkArray : [{ label: groupLabel, url: linkArray }];
            const isHovered = hoveredGroup === groupIdx;
            return React.createElement('div', {
              key: groupIdx,
              style: { position: 'relative' },
              onMouseEnter: () => setHoveredGroup(groupIdx),
              onMouseLeave: () => setHoveredGroup(null)
            }, 
              React.createElement('div', {
                style: {
                  display: 'inline-block',
                  padding: '10px 16px',
                  backgroundColor: isHovered ? '#e3f2fd' : '#f5f5f5',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#1976d2',
                  transition: 'background-color 0.2s',
                  position: 'relative'
                }
              }, groupLabel, ' ', React.createElement('span', { style: { fontSize: '12px' } }, '▼')),
              isHovered && links.length > 1 && React.createElement('div', {
                style: {
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '4px',
                  backgroundColor: 'white',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  zIndex: 1000,
                  minWidth: '200px',
                  padding: '4px 0'
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
                      padding: '8px 16px',
                      textDecoration: 'none',
                      color: '#1976d2',
                      fontSize: '13px',
                      transition: 'background-color 0.2s'
                    },
                    onMouseEnter: (e) => { e.target.style.backgroundColor = '#f5f5f5'; },
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
