import React, { useState, useMemo } from 'react';
import { useRequestsList, useMarkAsPaid, useCancelRequest } from '../hooks/useRequests';
import { useAuth } from '../contexts/AuthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '../components/ui/chart';
import { usePaymentForecast, usePaymentHistory } from '../hooks/useAnalytics';
import { usePrompt } from '../contexts/PromptContext';

export const PaymentManagementPage = () => {
  const { user } = useAuth();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const { data, isLoading } = useRequestsList({ page: 1, limit: 50, status: 'pending_payment' });
  const { mutate: markAsPaid } = useMarkAsPaid();
  const { mutate: cancelRequest } = useCancelRequest();
  const requests = data?.data || [];
  const prompt = usePrompt();

  const { data: forecastData = [] } = usePaymentForecast({
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
  });

  const { data: historyData = [] } = usePaymentHistory({
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
  });

  const chartData = useMemo(() => {
    const map = {};
    historyData.forEach(item => {
      map[item.date] = { date: item.date, paid: item.amount, forecast: 0 };
    });
    forecastData.forEach(item => {
      if (!map[item.date]) {
        map[item.date] = { date: item.date, paid: 0, forecast: item.amount };
      } else {
        map[item.date].forecast = item.amount;
      }
    });
    return Object.values(map).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [historyData, forecastData]);

  const formatCurrency = (value) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const handlePaid = async (id) => {
    const notes = await prompt({ title: 'Observações do pagamento' });
    if (notes === null) return;
    markAsPaid({
      id,
      paymentDetails: {
        paidBy: user.id,
        paidByName: user.name,
        paymentDate: new Date(),
        notes,
      },
    });
  };

  const handleCancel = async (id) => {
    const reason = await prompt({ title: 'Motivo do cancelamento' });
    if (!reason) return;
    cancelRequest({ id, reason, userId: user.id, userName: user.name });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestão de Pagamentos</h1>
        <p className="text-muted-foreground">Despesas aguardando pagamento</p>
      </div>

      <div className="bg-white rounded-lg border p-4 space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm">De:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border rounded px-2 py-1"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm">Até:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border rounded px-2 py-1"
            />
          </div>
        </div>
        <ChartContainer
          className="w-full"
          config={{
            forecast: {
              label: 'Valor Previsto',
              color: 'hsl(var(--chart-1))',
            },
            paid: {
              label: 'Valor Pago',
              color: 'hsl(var(--chart-2))',
            },
          }}
        >
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Line type="monotone" dataKey="forecast" stroke="var(--color-forecast)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="paid" stroke="var(--color-paid)" strokeWidth={2} dot={false} />
          </LineChart>
        </ChartContainer>
      </div>

      <div className="bg-white rounded-lg border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Solicitação</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fornecedor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center">Carregando...</td>
              </tr>
            ) : (
              requests.map((req) => (
                <tr key={req.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{req.requestNumber || req.number}</div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">{req.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{req.vendorName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatCurrency(req.amount)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => handlePaid(req.id)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Pagamento Realizado
                    </button>
                    <button
                      onClick={() => handleCancel(req.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Cancelar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {!isLoading && requests.length === 0 && (
          <div className="p-6 text-center text-sm text-gray-500">Nenhuma despesa pendente.</div>
        )}
      </div>
    </div>
  );
};

export default PaymentManagementPage;

