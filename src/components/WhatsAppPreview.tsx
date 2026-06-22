import { useState, useEffect } from 'react';
import { Requisition } from '../types';
import { MessageSquare, Copy, ExternalLink, HelpCircle, Save, Check } from 'lucide-react';

interface WhatsAppPreviewProps {
  requisition: Requisition;
}

export default function WhatsAppPreview({ requisition }: WhatsAppPreviewProps) {
  const [phoneNumber, setPhoneNumber] = useState<string>(() => {
    // Get saved contact number from localStorage or default empty
    return localStorage.getItem('wafort_wa_recipient') || '';
  });
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  // Auto clean phone number formatting
  const handlePhoneChange = (val: string) => {
    const cleaned = val.replace(/[^0-9]/g, '');
    setPhoneNumber(cleaned);
    setSaved(false);
  };

  const savePhoneToLocalStorage = () => {
    localStorage.setItem('wafort_wa_recipient', phoneNumber);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // Generate the beautifully formatted WhatsApp message text
  const getFormattedMessageText = () => {
    const companyName = requisition.companyName || 'WA FORT';
    const title = `*REQUISIÇÃO DE COMPRA/SERVIÇO — ${companyName.toUpperCase()}* 🛡️`;
    const headerSep = `=======================================`;
    
    const reqNum = `*Nº Requisição:* ${requisition.requisitionNumber}`;
    const requester = `*Solicitante:* ${requisition.requesterName || 'Não Informado'}`;
    const fieldSetor = `*Setor/Obra:* ${requisition.sector || `Administração - ${companyName}`}`;
    const priority = `*Urgência:* ${requisition.urgency.toUpperCase()}`;
    const reason = `*Justificativa:* _"${requisition.justification || 'Abastecimento padrão.'}"_`;

    const itemsHeader = `\n*📦 ITENS SOLICITADOS:*`;
    
    const itemsLines = requisition.items.map((item, index) => {
      let line = `${index + 1}. *${item.name}* (Qtd: *${item.quantity}*)`;
      if (item.description) {
        line += `\n   _Espec: ${item.description}_`;
      }
      if (item.estimatedUnitPrice > 0) {
        const itemVal = (item.estimatedUnitPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        line += `\n   _Valor Est: ${itemVal}_`;
      }
      return line;
    }).join('\n');

    let totalSection = '';
    const totalValue = requisition.items.reduce((sum, item) => {
      const qty = parseFloat(item.quantity.replace(/[^0-9.]/g, '')) || 0;
      return sum + (item.estimatedUnitPrice * (qty > 0 ? qty : 1));
    }, 0);
    const hasPrices = requisition.items.some(i => i.estimatedUnitPrice > 0);

    if (hasPrices && totalValue > 0) {
      const curTotal = totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      totalSection = `\n💰 *VALOR TOTAL ESTIMADO:* ${curTotal}`;
    }

    let obsSection = '';
    if (requisition.observationsToApprover) {
      obsSection = `\n📝 *OBSERVAÇÕES:* \n_"${requisition.observationsToApprover}"_`;
    }

    const footer = `\n${headerSep}\n_Gerado e conferido com o sistema inteligente RequisiJá. Chave de Autenticação: ${requisition.id.substring(0, 8).toUpperCase()}_`;

    return `${title}\n${headerSep}\n${reqNum}\n${requester}\n${fieldSetor}\n${priority}\n${reason}${itemsHeader}\n${itemsLines}${totalSection}${obsSection}\n${footer}`;
  };

  const messageText = getFormattedMessageText();

  // Copy structured text to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      alert("Falha ao copiar mensagem. Por favor, selecione e copie o texto abaixo.");
    }
  };

  // Generate web links for WhatsApp browser trigger
  const whatsappUrl = () => {
    const encodedText = encodeURIComponent(messageText);
    // Standard format - prefix with country code (e.g. 55 for Brazil)
    // If phone number is empty, open global send URL without a direct number
    if (phoneNumber.trim().length > 0) {
      return `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodedText}`;
    }
    return `https://api.whatsapp.com/send?text=${encodedText}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden font-sans">
      
      {/* Header */}
      <div className="bg-brand-blue-950 text-white p-5 flex items-center justify-between border-b border-brand-gold-500/20">
        <div className="flex items-center gap-2.5">
          <MessageSquare className="w-5 h-5 text-brand-gold-500" />
          <div>
            <h3 className="font-display font-semibold text-lg">Envio no WhatsApp Corporativo</h3>
            <p className="text-xs text-slate-300">Automação de conversa e faturamento livre de APIs</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        
        {/* Destination Number Setup */}
        <div className="bg-brand-blue-50/50 rounded-lg p-4 border border-brand-blue-100/50">
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                WhatsApp de Destino (Setor de Compras)
                <span className="text-slate-400 capitalize font-medium text-[10px]">(Com código de país, ex: 5511...)</span>
              </label>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="Ex: 5511999999999"
                className="w-full px-3 py-2 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-blue-600 rounded-lg text-sm font-mono tracking-wider text-slate-800"
              />
            </div>
            
            <div className="flex gap-2 w-full sm:w-auto">
              {phoneNumber.length > 5 && (
                <button
                  type="button"
                  onClick={savePhoneToLocalStorage}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold text-brand-blue-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-all cursor-pointer"
                  title="Salvar como destinatário padrão"
                >
                  {saved ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Save className="w-3.5 h-3.5" />}
                  {saved ? 'Salvo!' : 'Salvar Destinatário'}
                </button>
              )}
            </div>
          </div>
          
          <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
            💡 <strong>Dica:</strong> Se deixar vazio, o WhatsApp abrirá seu catálogo de conversas para que selecione o destinatário manualmente no momento do envio.
          </p>
        </div>

        {/* Live Preview Text Message representation */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Conteúdo da Mensagem Automatizada:</span>
            
            <button
              type="button"
              onClick={handleCopy}
              className="text-xs text-brand-blue-800 hover:text-brand-blue-900 flex items-center gap-1 font-semibold underline decoration-dotted bg-transparent border-0 cursor-pointer"
            >
              {copied ? 'Copiado!' : 'Copiar Texto'}
              <Copy className="sm:inline w-3 h-3" />
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-700/50 rounded-lg p-4 font-mono text-xs text-emerald-400 overflow-y-auto max-h-72 whitespace-pre-wrap leading-relaxed shadow-inner">
            {messageText}
          </div>
        </div>

        {/* Browser Action triggers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          
          {/* Direct link trigger */}
          <a
            href={whatsappUrl()}
            target="_blank"
            referrerPolicy="no-referrer"
            className="w-full py-3.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-500 text-white hover:from-emerald-700 hover:to-teal-600 transition-all shadow-md active:scale-[0.99] border-0"
          >
            <ExternalLink className="w-4 h-4" />
            Iniciar Envio no WhatsApp
          </a>

          {/* Styled clipboard copy as secondary action */}
          <button
            type="button"
            onClick={handleCopy}
            className="w-full py-3.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-brand-gold-500 to-brand-gold-600 text-brand-blue-950 hover:from-brand-gold-600 hover:to-brand-gold-700 transition-all shadow-md border-0 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-brand-blue-950 font-bold" />
                Mensagem Copiada!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copiar p/ Envio Manual
              </>
            )}
          </button>

        </div>

        <div className="text-[10px] text-slate-400 leading-relaxed text-center mt-3">
          🔒 <strong>Aviso de Automação Limpa:</strong> Sem mensalidades nem APIs pagas. O link de automação utiliza a estrutura oficial do WhatsApp Web. Após clicar, o navegador abrirá uma nova janela com a conversa preenchida. O usuário apenas aperta "Enter" ou "Enviar" para despachar de sua própria conta corporativa segura.
        </div>

      </div>
    </div>
  );
}
