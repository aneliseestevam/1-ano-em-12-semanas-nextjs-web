"use client";

import { useState } from 'react';
import { X, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function ApiStatusTest({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [testResults, setTestResults] = useState<Record<string, unknown>[]>([]);
  const [testing, setTesting] = useState(false);

  const testApiEndpoints = async () => {
    setTesting(true);
    setTestResults([]);
    
    const endpoints = [
      { name: 'API Base', url: '/api/auth/me', method: 'GET' },
      { name: 'Login', url: '/api/auth/login', method: 'POST' },
      { name: 'Register', url: '/api/auth/register', method: 'POST' },
    ];

    const results = [];

    for (const endpoint of endpoints) {
      try {
        const startTime = Date.now();
        
        const response = await fetch(endpoint.url, {
          method: endpoint.method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: endpoint.method === 'POST' ? JSON.stringify({ test: true }) : undefined,
        });
        
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        let responseData;
        let isJson = false;
        
        try {
          responseData = await response.json();
          isJson = true;
        } catch {
          responseData = await response.text();
        }

        results.push({
          name: endpoint.name,
          status: response.status,
          statusText: response.statusText,
          responseTime,
          isJson,
          data: responseData,
          success: response.ok,
        });
      } catch (error: unknown) {
        results.push({
          name: endpoint.name,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          success: false,
        });
      }
    }

    setTestResults(results);
    setTesting(false);
  };

  const getStatusIcon = (result: Record<string, unknown>) => {
    if (result.error) return <XCircle className="w-5 h-5 text-red-500" />;
    if (result.success) return <CheckCircle className="w-5 h-5 text-green-500" />;
    return <AlertCircle className="w-5 h-5 text-yellow-500" />;
  };

  const getStatusColor = (result: Record<string, unknown>) => {
    if (result.error) return 'border-red-200 bg-red-50';
    if (result.success) return 'border-green-200 bg-green-50';
    return 'border-yellow-200 bg-yellow-50';
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-auto max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900">Teste de Status da API</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Test Button */}
          <div className="text-center">
            <button
              onClick={testApiEndpoints}
              disabled={testing}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
            >
              {testing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Testando...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Testar Endpoints da API</span>
                </>
              )}
            </button>
          </div>

          {/* Results */}
          {testResults.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Resultados dos Testes:</h3>
              
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${getStatusColor(result)}`}
                >
                  <div className="flex items-start space-x-3">
                    {getStatusIcon(result)}
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{String(result.name || 'Endpoint')}</h4>
                      
                      {result.error ? (
                        <p className="text-red-600 text-sm mt-1">{String(result.error || 'Erro desconhecido')}</p>
                      ) : (
                        <div className="text-sm text-gray-600 mt-2 space-y-1">
                          <p><strong>Status:</strong> {String(result.status || 'N/A')} {String(result.statusText || '')}</p>
                          <p><strong>Tempo de Resposta:</strong> {String(result.responseTime || 0)}ms</p>
                          <p><strong>Tipo de Resposta:</strong> {result.isJson ? 'JSON' : 'Texto'}</p>
                          
                          {result.data !== undefined && (
                            <details className="mt-2">
                              <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                                Ver Resposta
                              </summary>
                              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                                {JSON.stringify(result.data || {}, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Como Interpretar os Resultados:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Verde:</strong> Endpoint funcionando corretamente</li>
              <li>• <strong>Amarelo:</strong> Endpoint responde mas com erro HTTP</li>
              <li>• <strong>Vermelho:</strong> Erro de conexão ou servidor offline</li>
              <li>• <strong>Status 500:</strong> Erro interno do servidor</li>
              <li>• <strong>Status 404:</strong> Endpoint não encontrado</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
