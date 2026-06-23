import React, { useState } from 'react';
import { Requisition, RequisitionItem, HistoryRecord, Attachment } from '../types';
import { 
  Plus, 
  Trash2, 
  ShieldCheck, 
  AlertCircle, 
  ShoppingBag, 
  Landmark, 
  Info, 
  Sliders, 
  Building2, 
  CreditCard,
  Search,
  Sparkles,
  X,
  Paperclip,
  Upload
} from 'lucide-react';

interface RequisitionFormProps {
  requisition: Requisition;
  onChange: (updated: Requisition) => void;
  history?: HistoryRecord[];
}

export default function RequisitionForm({ requisition, onChange, history }: RequisitionFormProps) {
  const [showWhitelabelSettings, setShowWhitelabelSettings] = useState(false);
  const [itemSearchQuery, setItemSearchQuery] = useState('');

  // Handle high-level input changes (text boxes, selects)
  const handleMetaChange = (key: keyof Requisition, value: any) => {
    onChange({
      ...requisition,
      [key]: value,
    });
  };

  // Handle item value changes
  const handleItemChange = (itemId: string, field: keyof RequisitionItem, value: any) => {
    const updatedItems = requisition.items.map((item) => {
      if (item.id === itemId) {
        if (field === 'estimatedUnitPrice') {
          // ensure number type
          const numeric = parseFloat(value) || 0;
          return { ...item, [field]: numeric };
        }
        return { ...item, [field]: value };
      }
      return item;
    });
    onChange({
      ...requisition,
      items: updatedItems,
    });
  };

  // Remove an item
  const handleRemoveItem = (itemId: string) => {
    // If there is only one item, instead of showing a blocking alert that crashes in sandboxed iframes,
    // we reset this single remaining row to empty so they can "delete" its content/clear it.
    if (requisition.items.length <= 1) {
      const resetItems = requisition.items.map(item => {
        if (item.id === itemId) {
          return {
            id: item.id,
            name: '',
            quantity: '1',
            description: '',
            estimatedUnitPrice: 0
          };
        }
        return item;
      });
      onChange({
        ...requisition,
        items: resetItems,
      });
      return;
    }

    const updatedItems = requisition.items.filter((item) => item.id !== itemId);
    onChange({
      ...requisition,
      items: updatedItems,
    });
  };

  // Handle Attachments
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    
    Array.from(e.target.files).forEach((file: File) => {
      const maxSize = 5 * 1024 * 1024; // 5 MB limit per attachment
      if (file.size > maxSize) {
        alert(`O arquivo ${file.name} excede o limite de tamanho permitido de 5MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const newAttachment: Attachment = {
            id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
            name: file.name,
            type: file.type,
            content: event.target.result as string,
          };
          
          onChange({
            ...requisition,
            attachments: [...(requisition.attachments || []), newAttachment],
          });
        }
      };
      reader.readAsDataURL(file);
    });
    
    // Clear input
    e.target.value = '';
  };

  const handleRemoveAttachment = (attachmentId: string) => {
    const updatedAttachments = (requisition.attachments || []).filter((att) => att.id !== attachmentId);
    onChange({
      ...requisition,
      attachments: updatedAttachments,
    });
  };

  // Add a blank new item row
  const handleAddItem = () => {
    const newItem: RequisitionItem = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
      name: '',
      quantity: '1',
      description: '',
      estimatedUnitPrice: 0,
    };
    onChange({
      ...requisition,
      items: [...requisition.items, newItem],
    });
  };

  // Assemble unique WA FORT products list from historical data and common presets
  const allUniqueItems = (() => {
    const itemsMap = new Map<string, RequisitionItem>();
    
    // Default system catalog for common materials in WA FORT operations
    const defaultCommonItems: RequisitionItem[] = [
      { id: 'def-1', name: 'Câmera Intelbras Bullet Full HD VHD 1220 B', quantity: '1', description: 'Visão noturna infravermelho 20m, lente de 3.6mm', estimatedUnitPrice: 189.90 },
      { id: 'def-2', name: 'Câmera Intelbras Dome VHL 1120 D Full HD', quantity: '1', description: 'Lente de 2.8mm, acabamento plástico', estimatedUnitPrice: 149.90 },
      { id: 'def-3', name: 'DVR Intelbras Multi-HD de 8 canais iMVD', quantity: '1', description: 'H.265+, inteligência artificial de detecção', estimatedUnitPrice: 699.00 },
      { id: 'def-4', name: 'DVR Intelbras Multi-HD de 16 canais iMVD', quantity: '1', description: 'H.265+, detecção inteligente de pessoas e veículos', estimatedUnitPrice: 899.00 },
      { id: 'def-5', name: 'Fonte Colmeia Estabilizada 12V 10A Bivolt', quantity: '1', description: 'Carcaça de metal perfurada com cooler', estimatedUnitPrice: 49.90 },
      { id: 'def-6', name: 'Fonte Colmeia Estabilizada 12V 15A de Metal', quantity: '1', description: 'Bivolt, proteção contra curto e sobrecarga', estimatedUnitPrice: 59.90 },
      { id: 'def-7', name: 'Rolo de Cabo Coaxial bipolar flexível 4mm 100% cobre 100m', quantity: '1', description: 'Malha de 95%, ideal para CFTV analógico HD', estimatedUnitPrice: 145.00 },
      { id: 'def-8', name: 'Sensor Infravermelho Passivo IVP 3000 de Teto', quantity: '1', description: 'Intelbras, detecção em 360 graus', estimatedUnitPrice: 39.00 },
      { id: 'def-9', name: 'Conector BNC macho de mola com parafuso', quantity: '1', description: 'Blindagem de sinal, mola de proteção para cabo', estimatedUnitPrice: 6.50 },
      { id: 'def-10', name: 'Conector P4 macho com borne de parafuso', quantity: '1', description: 'Plug rápido para alimentação de câmeras 12V', estimatedUnitPrice: 3.50 },
      { id: 'def-11', name: 'Bateria Recarregável Estacionária Heliar 12V 9Ah', quantity: '1', description: 'Tecnologia chumbo-ácido AGM livre de manutenção', estimatedUnitPrice: 120.00 },
      { id: 'def-12', name: 'Central de Cerca Elétrica GCP 10000 Flex', quantity: '1', description: 'Central de choque de alta energia com controle', estimatedUnitPrice: 249.90 },
      { id: 'def-13', name: 'Sensor de Barreira Infravermelho Ativo IVA 3070', quantity: '1', description: 'Intelbras, feixe duplo para cercas e muros de até 70m', estimatedUnitPrice: 199.00 }
    ];

    // Seed defaults
    defaultCommonItems.forEach(item => {
      itemsMap.set(item.name.toLowerCase().trim(), item);
    });

    // Layer history
    if (history && history.length > 0) {
      history.forEach(record => {
        if (record.data && record.data.items) {
          record.data.items.forEach(item => {
            if (item && item.name && item.name.trim()) {
              itemsMap.set(item.name.toLowerCase().trim(), {
                ...item,
                id: `hist-item-${item.id}`
              });
            }
          });
        }
      });
    }

    return Array.from(itemsMap.values());
  })();

  // Filter recommendations matching the search query
  const filteredSuggestions = itemSearchQuery.trim()
    ? allUniqueItems.filter(item => 
        item.name.toLowerCase().includes(itemSearchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(itemSearchQuery.toLowerCase()))
      ).slice(0, 10)
    : [];

  const handleAddSuggestedItem = (suggested: RequisitionItem) => {
    // If the last item of the current form list is empty, replace it
    const lastItem = requisition.items[requisition.items.length - 1];
    const isLastItemEmpty = lastItem && (!lastItem.name || lastItem.name === 'Equipamento de segurança eletrônica...' || lastItem.name === '');

    const newItem: RequisitionItem = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
      name: suggested.name,
      quantity: '1',
      description: suggested.description || '',
      estimatedUnitPrice: suggested.estimatedUnitPrice || 0,
    };

    let updatedItems = [...requisition.items];
    if (isLastItemEmpty) {
      // Replace the last item
      updatedItems[updatedItems.length - 1] = newItem;
    } else {
      // Append the new item
      updatedItems.push(newItem);
    }

    onChange({
      ...requisition,
      items: updatedItems,
    });

    setItemSearchQuery('');
  };

  // Autocomplete field inputs with lookup auto-fill of prices/descriptions when typing
  const handleItemNameChangeWithLookup = (itemId: string, nameValue: string) => {
    const matchedItem = allUniqueItems.find(item => item.name.toLowerCase().trim() === nameValue.toLowerCase().trim());
    
    const updatedItems = requisition.items.map((item) => {
      if (item.id === itemId) {
        if (matchedItem) {
          return {
            ...item,
            name: nameValue,
            description: item.description || matchedItem.description || '',
            estimatedUnitPrice: item.estimatedUnitPrice || matchedItem.estimatedUnitPrice || 0,
          };
        }
        return { ...item, name: nameValue };
      }
      return item;
    });

    onChange({
      ...requisition,
      items: updatedItems,
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden font-sans">
      
      {/* Header of Form Panel */}
      <div className="bg-brand-blue-800 text-white p-5 flex justify-between items-center border-b border-brand-gold-500/20">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-brand-gold-500" />
          <div>
            <h3 className="font-display font-semibold text-lg">Formulário de Verificação</h3>
            <p className="text-xs text-brand-blue-100">Confirme ou altere os detalhes antes de enviar</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs text-brand-gold-400 font-mono ring-1 ring-brand-gold-500/30 px-2 py-0.5 rounded bg-brand-blue-900/50">
            Nº {requisition.requisitionNumber}
          </span>
        </div>
      </div>

      <div className="p-6 space-y-6">

        {/* Collapsible Whitelabel SaaS Customizer */}
        <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4">
          <button
            type="button"
            onClick={() => setShowWhitelabelSettings(!showWhitelabelSettings)}
            className="w-full flex items-center justify-between text-left focus:outline-none focus:ring-1 focus:ring-brand-blue-500 rounded-md py-1"
          >
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-brand-gold-600 shrink-0" />
              <div>
                <span className="text-xs font-bold text-brand-blue-900 uppercase tracking-wider block">
                  ⚙️ Whitelabel & Customização do Cliente
                </span>
                <span className="text-[10px] text-slate-500 block">
                  Altere o nome da empresa, slogan e dados corporativos no PDF e WhatsApp
                </span>
              </div>
            </div>
            <span className="text-xs font-semibold text-brand-blue-800 bg-brand-blue-50 hover:bg-brand-blue-150 px-2.5 py-1 rounded transition-all">
              {showWhitelabelSettings ? 'Recolher Painel' : 'Expandir Opções'}
            </span>
          </button>

          {showWhitelabelSettings && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-200/75 animate-fadeIn">
              
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  Nome da Empresa
                </label>
                <input
                  type="text"
                  placeholder="Ex: Minha Empresa Corp, RequisiJá"
                  value={requisition.companyName || ''}
                  onChange={(e) => handleMetaChange('companyName', e.target.value)}
                  className="w-full px-2.5 py-2 text-base md:text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-brand-blue-600 focus:border-transparent text-slate-800 bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                  Slogan / Atividade Principal
                </label>
                <input
                  type="text"
                  placeholder="Ex: Sistemas e Serviços de Obra"
                  value={requisition.companySub || ''}
                  onChange={(e) => handleMetaChange('companySub', e.target.value)}
                  className="w-full px-2.5 py-2 text-base md:text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-brand-blue-600 focus:border-transparent text-slate-800 bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                  CNPJ Corporativo
                </label>
                <input
                  type="text"
                  placeholder="Ex: 12.345.678/0001-90"
                  value={requisition.companyCnpj || ''}
                  onChange={(e) => handleMetaChange('companyCnpj', e.target.value)}
                  className="w-full px-2.5 py-2 text-base md:text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-brand-blue-600 focus:border-transparent text-slate-800 bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                  Termos de Faturamento
                </label>
                <input
                  type="text"
                  placeholder="Ex: Faturar 30 dias via Boleto"
                  value={requisition.paymentTerms || ''}
                  onChange={(e) => handleMetaChange('paymentTerms', e.target.value)}
                  className="w-full px-2.5 py-2 text-base md:text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-brand-blue-600 focus:border-transparent text-slate-800 bg-white"
                />
              </div>

            </div>
          )}
        </div>
        
        {/* Requisition Identification Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <div className="flex-1">
            <label className="block text-xs font-bold text-brand-blue-900 mb-1">
              Solicitante / Responsável
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 text-base md:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-600 focus:border-transparent"
              placeholder="Ex: Técnico André Souza"
              value={requisition.requesterName}
              onChange={(e) => handleMetaChange('requesterName', e.target.value)}
            />
          </div>

          <div className="flex-1">
            <label className="block text-xs font-bold text-brand-blue-900 mb-1">
              Setor / Destino
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 text-base md:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-600 focus:border-transparent"
              placeholder="Ex: Instalação Condomínio X"
              value={requisition.sector}
              onChange={(e) => handleMetaChange('sector', e.target.value)}
            />
          </div>

        </div>

        {/* Priority & Justification Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 pt-5">
          
          <div>
            <label className="block text-xs font-bold text-brand-blue-900 mb-1">
              Urgência
            </label>
            <select
              className="w-full px-3 py-2 text-base md:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-600 bg-white"
              value={requisition.urgency}
              onChange={(e) => handleMetaChange('urgency', e.target.value as Requisition['urgency'])}
            >
              <option value="Baixa">Baixa</option>
              <option value="Média">Média</option>
              <option value="Alta">Alta</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-brand-blue-900 mb-1">
              Justificativa / Motivo da Solicitação
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 text-base md:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-600 focus:border-transparent"
              placeholder="Ex: Reposição de estoque preventivo / Substituição de material danificado"
              value={requisition.justification}
              onChange={(e) => handleMetaChange('justification', e.target.value)}
            />
          </div>

        </div>

        {/* Items Section */}
        <div className="border-t border-slate-100 pt-5">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-bold text-brand-blue-800 flex items-center gap-1.5 uppercase tracking-wide">
              <ShoppingBag className="w-4 h-4 text-brand-gold-500" />
              Relação de Materiais
            </h4>
            
            <button
              type="button"
              onClick={handleAddItem}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-brand-blue-800 bg-brand-blue-50 hover:bg-brand-blue-100 border border-brand-blue-200 rounded-lg Transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-brand-gold-550" />
              Adicionar Item
            </button>
          </div>

          {/* Quick Search & Suggestion Bar */}
          <div className="mb-4 bg-slate-50 border border-slate-200/60 rounded-xl p-3.5 shadow-sm">
            <label className="block text-[10px] font-bold text-brand-blue-900 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-brand-gold-500" />
              Buscador de Materiais WA FORT (Sugeridos do Histórico)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-9 pr-8 py-2 md:py-2.5 border border-slate-250 rounded-lg text-base md:text-xs text-slate-850 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-blue-600 bg-white"
                placeholder="Busque por material comum..."
                value={itemSearchQuery}
                onChange={(e) => setItemSearchQuery(e.target.value)}
              />
              {itemSearchQuery && (
                <button
                  type="button"
                  onClick={() => setItemSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Suggestions list popup */}
            {itemSearchQuery.trim() && (
              <div className="mt-2 max-h-48 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg bg-white shadow-md font-sans animate-fadeIn">
                {filteredSuggestions.length > 0 ? (
                  filteredSuggestions.map((item, idx) => (
                    <button
                      key={item.id || idx}
                      type="button"
                      onClick={() => handleAddSuggestedItem(item)}
                      className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 flex items-center justify-between text-xs transition-all duration-150 group"
                    >
                      <div className="space-y-0.5 pr-2 truncate">
                        <span className="font-semibold text-slate-800 block truncate group-hover:text-brand-blue-900">
                          {item.name}
                        </span>
                        {item.description && (
                          <span className="text-[10px] text-slate-400 block truncate italic font-normal">
                            {item.description}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {item.estimatedUnitPrice > 0 && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono font-bold">
                            R$ {item.estimatedUnitPrice.toFixed(2)}
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-brand-blue-700 bg-brand-blue-50 border border-brand-blue-100 px-2 py-0.5 rounded group-hover:bg-brand-blue-600 group-hover:text-white transition-all">
                          + Adicionar
                        </span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-3.5 text-center text-xs text-slate-400 italic">
                    Nenhum material correspondente no histórico. Digite para criar um novo.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* List display with card-based mobile view */}
          <div className="flex flex-col gap-3">
            {requisition.items.map((item, index) => (
              <div key={item.id} className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">Item #{index + 1}</span>
                  <button type="button" onClick={() => handleRemoveItem(item.id)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Nome do Item</label>
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => handleItemNameChangeWithLookup(item.id, e.target.value)}
                    className="w-full px-3 py-2 text-base md:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-600"
                    placeholder="Descrição do material..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Quant.</label>
                    <input
                      type="text"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                      className="w-full px-3 py-2 text-base md:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Preço Un. (R$)</label>
                    <input
                      type="number"
                      value={item.estimatedUnitPrice}
                      onChange={(e) => handleItemChange(item.id, 'estimatedUnitPrice', e.target.value)}
                      className="w-full px-3 py-2 text-base md:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-600"
                    />
                  </div>
                </div>
                <div>
                   <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Obs/Marca</label>
                   <input
                     type="text"
                     value={item.description}
                     onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                     className="w-full px-3 py-2 text-base md:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-600"
                   />
                </div>
              </div>
            ))}
          </div>

          <datalist id="common-products">
            {allUniqueItems.map((item, idx) => (
              <option key={item.id || idx} value={item.name} />
            ))}
          </datalist>
        </div>

        {/* Operational Observations */}
        <div className="border-t border-slate-100 pt-5">
          <label className="block text-xs font-bold text-brand-blue-900 mb-1">
            Observações para o Aprovador (Opcional)
          </label>
          <textarea
            className="w-full px-3 py-2 text-base md:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-600 focus:border-transparent"
            rows={2}
            placeholder="Ex: Entregar com urgência na obra do bloco B..."
            value={requisition.observationsToApprover}
            onChange={(e) => handleMetaChange('observationsToApprover', e.target.value)}
          ></textarea>
        </div>

        {/* Attachments Section */}
        <div className="border-t border-slate-100 pt-5">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-bold text-brand-blue-800 flex items-center gap-1.5 uppercase tracking-wide">
              <Paperclip className="w-4 h-4 text-brand-gold-500" />
              Anexos e Documentos Comprobatórios
            </h4>
            
            <label className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-brand-blue-800 bg-brand-blue-50 hover:bg-brand-blue-100 border border-brand-blue-200 rounded-lg transition-all cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-brand-gold-550" />
              Anexar Arquivo
              <input 
                type="file" 
                multiple 
                className="hidden" 
                accept="image/*,application/pdf"
                onChange={handleFileUpload} 
              />
            </label>
          </div>

          {(requisition.attachments && requisition.attachments.length > 0) ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {requisition.attachments.map((att) => (
                <div key={att.id} className="relative flex items-center gap-2 p-2 border border-slate-200 rounded-lg bg-slate-50 group">
                  <div className="w-10 h-10 rounded bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                    {att.type.startsWith('image/') ? (
                      <img src={att.content} alt={att.name} className="w-full h-full object-cover" />
                    ) : (
                      <Paperclip className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-700 truncate" title={att.name}>{att.name}</p>
                    <p className="text-[10px] text-slate-400 uppercase">{att.type.split('/')[1]}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(att.id)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-100 border border-red-200 text-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remover anexo"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
             <div className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-lg text-center border border-dashed border-slate-200">
               Nenhum anexo. Adicione fotos de orçamentos, requisições antigas ou PDFs.
             </div>
          )}
        </div>

      </div>
    </div>
  );
}
