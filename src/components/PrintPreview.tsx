import { Requisition } from '../types';
import { ShieldCheck, Calendar, FileText, BadgeAlert, Coins } from 'lucide-react';

interface PrintPreviewProps {
  requisition: Requisition;
}

export default function PrintPreview({ requisition }: PrintPreviewProps) {
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Calculate grand total or check if there are any priced items
  const totalValue = requisition.items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity.replace(/[^0-9.]/g, '')) || 0;
    return sum + (item.estimatedUnitPrice * (qty > 0 ? qty : 1));
  }, 0);

  const hasEstimatedPrices = requisition.items.some(i => i.estimatedUnitPrice > 0);

  const companyName = requisition.companyName || 'WA FORT';
  const companySub = requisition.companySub || 'Segurança Eletrônica e Monitoramento';
  const companyCnpj = requisition.companyCnpj || '43.210.987/0001-55';

  return (
    <div id="print-area" className="w-full max-w-4xl mx-auto bg-white text-slate-800 p-8 md:p-12 border border-slate-200 shadow-xl rounded-xl font-sans relative overflow-hidden">
      
      {/* Golden accent bar top */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-blue-800 via-brand-gold-500 to-brand-blue-700" />

      {/* Corporate Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 mb-6 border-b-2 border-slate-100">
        <div>
          <div className="flex items-center gap-3">
            {/* WA FORT Official Logo */}
            <div className="w-16 h-16 rounded-lg overflow-hidden flex items-center justify-center bg-white p-1 border border-slate-200 shadow-sm shrink-0">
              <img 
                src="https://i.ibb.co/C32GVNqh/logo.webp" 
                alt="WA FORT Logo" 
                className="object-contain w-full h-full" 
                referrerPolicy="no-referrer" 
                onError={(e) => {
                  // Fallback to standard shield icon if image fails to load in offline/local environments
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <h1 className="font-display font-bold text-2xl tracking-tight text-brand-blue-800 uppercase">
                {companyName}
              </h1>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">
                {companySub}
              </p>
              {companyCnpj && (
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">CNPJ: {companyCnpj}</p>
              )}
            </div>
          </div>
        </div>

        {/* Requisition Number and Date */}
        <div className="mt-4 sm:mt-0 text-left sm:text-right flex flex-col items-start sm:items-end">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-blue-100/70 border border-brand-blue-200/50 text-brand-blue-800 text-xs font-semibold mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-gold-500 animate-pulse" />
            Nº {requisition.requisitionNumber}
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> 
            Emissão: {new Date(requisition.createdAt).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </div>

      <div className="text-center mb-8">
        <h2 className="text-xl uppercase font-bold tracking-wider text-brand-blue-900 border-b border-brand-gold-500/30 pb-2 inline-block">
          REQUISIÇÃO DE COMPRAS E SERVIÇOS
        </h2>
      </div>

      {/* Meta Fields (Requester, Dept, Urgencia) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 bg-brand-blue-50/50 border border-brand-blue-100/70 rounded-lg p-5">
        <div className="space-y-2">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Identificação</p>
          <div className="text-sm">
            <span className="font-semibold text-slate-700">Solicitante:</span>{' '}
            <span className="text-slate-900">{requisition.requesterName || 'Não especificado (Almoxarifado)'}</span>
          </div>
          <div className="text-sm">
            <span className="font-semibold text-slate-700">Setor/Obra:</span>{' '}
            <span className="text-slate-900">{requisition.sector || `Administração - ${companyName}`}</span>
          </div>
        </div>

        <div className="space-y-2 border-t md:border-t-0 md:border-l border-slate-200/80 pt-4 md:pt-0 md:pl-5">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Detalhes de Entrega & Prioridade</p>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-slate-700">Urgência:</span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase ${
              requisition.urgency === 'Alta' 
                ? 'bg-red-50 text-red-700 border border-red-100' 
                : requisition.urgency === 'Média'
                ? 'bg-amber-50 text-amber-700 border border-amber-100'
                : 'bg-green-50 text-green-700 border border-green-100'
            }`}>
              <BadgeAlert className="w-3 h-3 mr-1" />
              {requisition.urgency}
            </span>
          </div>
          <div className="text-sm">
            <span className="font-semibold text-slate-700">Justificativa:</span>{' '}
            <span className="text-slate-600 block sm:inline italic">
              "{requisition.justification || 'Abastecimento padrão de estoque / consumo operacional.'}"
            </span>
          </div>
        </div>
      </div>

      {/* Items Section */}
      <div className="mb-8">
        <h3 className="text-sm uppercase tracking-wider font-bold text-brand-blue-800 mb-3 flex items-center gap-1.5 border-b border-brand-gold-500/20 pb-1">
          <FileText className="w-4 h-4 text-brand-gold-500" />
          Relação de Itens / Materiais Solicitados
        </h3>

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-brand-blue-900 uppercase bg-brand-blue-100/40 border-b border-slate-200">
              <tr>
                <th scope="col" className="px-5 py-3.5 w-12 text-center">Item</th>
                <th scope="col" className="px-4 py-3.5">Descrição Técnica do Material / Especificação</th>
                <th scope="col" className="px-4 py-3.5 text-center w-24">Qtd.</th>
                {hasEstimatedPrices && (
                  <>
                    <th scope="col" className="px-4 py-3.5 text-right w-32">Prec. Est (Un)</th>
                    <th scope="col" className="px-4 py-3.5 text-right w-32">Subtotal est.</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requisition.items.map((item, index) => {
                const qtyNumeric = parseFloat(item.quantity.replace(/[^0-9.]/g, '')) || 1;
                const subtotal = item.estimatedUnitPrice * qtyNumeric;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-4 text-slate-400 font-mono text-center">{index + 1}</td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-slate-900">{item.name}</div>
                      {item.description && (
                        <div className="text-xs text-slate-500 italic mt-0.5">{item.description}</div>
                      )}
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-700 text-center">{item.quantity}</td>
                    {hasEstimatedPrices && (
                      <>
                        <td className="px-4 py-4 text-right font-mono text-slate-600">
                          {item.estimatedUnitPrice > 0 ? formatCurrency(item.estimatedUnitPrice) : '—'}
                        </td>
                        <td className="px-4 py-4 text-right font-semibold font-mono text-slate-900">
                          {item.estimatedUnitPrice > 0 ? formatCurrency(subtotal) : '—'}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Grand Total Value Statement (if prices exist) */}
        {hasEstimatedPrices && totalValue > 0 && (
          <div className="flex justify-end mt-4">
            <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-lg border border-brand-gold-500/30 bg-brand-blue-50/30 text-brand-blue-900">
              <Coins className="w-4 h-4 text-brand-gold-500" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Valor Estimado Total:</span>
              <span className="font-mono font-bold text-lg text-brand-blue-800">{formatCurrency(totalValue)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Observations Section */}
      {requisition.observationsToApprover && (
        <div className="mb-10 bg-slate-50/80 border border-slate-200/60 rounded-lg p-4">
          <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1">Observações Operacionais</h4>
          <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{requisition.observationsToApprover}</p>
        </div>
      )}

      {/* Signature blocks (Essential for official paper flows) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-12 mt-12 border-t border-slate-100/90 text-center">
        <div className="flex flex-col items-center">
          <div className="w-5/6 border-b border-dashed border-slate-300 h-8" />
          <p className="text-xs font-bold text-slate-700 mt-2">{requisition.requesterName || 'Solicitante'}</p>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Assinatura do Emissor</p>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-5/6 border-b border-dashed border-slate-300 h-8" />
          <p className="text-xs font-bold text-slate-700 mt-2">Responsável Setorial</p>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Visto / Gestor da Obra</p>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-5/6 border-b border-dashed border-slate-300 h-8" />
          <p className="text-xs font-bold text-slate-700 mt-2">Almoxarifado / Compras</p>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Autorização {companyName}</p>
        </div>
      </div>

      {/* Small Gold Accent Footer Seal */}
      <div className="mt-12 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 pt-3">
        <span>{companyName} &bull; Emissão de Requisição por IA (Selo RequisiJá)</span>
        <span className="flex items-center gap-1 font-semibold text-brand-gold-600 font-mono">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand-gold-500" />
          AUTENTICIDADE: {requisition.id.substring(0, 8).toUpperCase()}
        </span>
      </div>

    </div>
  );
}
