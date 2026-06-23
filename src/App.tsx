import React, { useState, useRef, useEffect } from 'react';
import { 
  ShieldCheck, 
  FileText, 
  Upload, 
  Sparkles, 
  Share2, 
  Printer, 
  Clock, 
  Trash2, 
  History, 
  FileCheck, 
  CornerDownRight, 
  CheckCircle, 
  Plus, 
  AlertCircle,
  HelpCircle,
  X,
  FileSpreadsheet,
  Search,
  Download,
  Save,
  Check,
  Pencil
} from 'lucide-react';
import { Requisition, HistoryRecord } from './types';
import RequisitionForm from './components/RequisitionForm';
import WhatsAppPreview from './components/WhatsAppPreview';
import PrintPreview from './components/PrintPreview';
import { parseTextToRequisition } from './utils/parser';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  Legend as ChartLegend
} from 'recharts';

// Demo prompt templates for immediate testing
const DEMO_TEMPLATES = [
  {
    title: "📹 Instalação CFTV / Câmeras",
    text: "Solicito materiais urgentes para instalação CFTV no cliente Condomínio Sol Nascente:\n- 8 Câmeras Intelbras Bullet Full HD VHD 1220 B\n- 1 HVR Intelbras Multi-HD de 8 canais com HD 1TB WD Purple instalado\n- 1 Rolo de Cabo Coaxial bipolar 4mm flexível com 100 metros\n- 1 Fonte Colmeia 12V 10A de metal bivolt\nSetor de Segurança Eletrônica, solicitado pelo técnico Marcos Roberto.",
    urgency: "Alta",
    sector: "Segurança Eletrônica / CFTV"
  },
  {
    title: "⚡ Cerca Elétrica / Alarmes",
    text: "Comprar para manutenção emergencial da barreira perimetral do Galpão Logístico:\n- 2 Centrais de Choque Intelbras ELC 5002 ou GCP 10000 Flex\n- 40 Hastes de alumínio perfil estrela de 4 isoladores em poliéster\n- 1 Rolo de fio de aço inox para cerca 0.70mm de 500m\n- 4 Sensores infravermelho ativo IVA 3070 duplo feixe\nSolicitante: Engenheiro Eduardo, Setor de Projetos e Campo.",
    urgency: "Média",
    sector: "Cerca Perimetral / Alarmes"
  },
  {
    title: "🔒 Controle de Acesso / Sede",
    text: "Solicitação de reposição de peças para o escritório da nova portaria:\n- 2 Fechaduras Elétricas Solenoide Failsafe 12V com suporte de vidro\n- 50 Tag Chaveiro de Proximidade RFID 125Khz azul para usuários\n- 1 Botoeira inox de embutir com moldura e leitor digital integrado\n- 1 Bateria selada recarregável 12V 7Ah\nPeso leve, despacho administrativo. Solicitante: Técnico Lucas de Oliveira.",
    urgency: "Baixa",
    sector: "Controle de Acesso"
  }
];

export default function App() {
  const [inputText, setInputText] = useState("");
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileMimeType, setFileMimeType] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'form' | 'whatsapp' | 'history'>('form');
  const [successAnimation, setSuccessAnimation] = useState(false);
  
  // Create an initial empty requisition
  const createEmptyRequisition = (): Requisition => {
    const trackingYear = new Date().getFullYear();
    const trackingRand = Math.floor(1000 + Math.random() * 9000);
    return {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
      requisitionNumber: `REQ-${trackingYear}-${trackingRand}`,
      requesterName: '',
      sector: '',
      urgency: 'Média',
      justification: '',
      items: [
        {
          id: 'item-1',
          name: 'Equipamento de segurança eletrônica...',
          quantity: '1',
          description: '',
          estimatedUnitPrice: 0
        }
      ],
      observationsToApprover: 'Faturamento direto para o CNPJ aprovado comercialmente pela WA FORT.',
      createdAt: new Date().toISOString(),
      companyName: 'WA FORT',
      companySub: 'Segurança Eletrônica e Monitoramento',
      companyCnpj: '43.210.987/0001-55',
    };
  };

  const initialReq = createEmptyRequisition();
  const [openRequisitions, setOpenRequisitions] = useState<Requisition[]>([initialReq]);
  const [activeReqId, setActiveReqId] = useState<string>(initialReq.id);

  const currentRequisition = openRequisitions.find(r => r.id === activeReqId) || openRequisitions[0];

  const setCurrentRequisition = (newReq: Requisition | ((prev: Requisition) => Requisition)) => {
    setOpenRequisitions(prev => prev.map(req => {
      if (req.id === activeReqId) {
        return typeof newReq === 'function' ? newReq(req) : newReq;
      }
      return req;
    }));
  };

  const [requisitionHistory, setRequisitionHistory] = useState<HistoryRecord[]>([]);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load history on initialization with beautiful pre-populated templates for testing
  useEffect(() => {
    const saved = localStorage.getItem('wafort_req_history');
    if (saved) {
      try {
        setRequisitionHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Erro carregando histórico", e);
      }
    } else {
      // Seed initial high-quality mock data for WA FORT Electronic Security
      const sample1: HistoryRecord = {
        id: 'sample-req-1',
        requisitionNumber: 'REQ-2026-7890',
        requesterName: 'Marcos Roberto (CFTV)',
        sector: 'Instalações - Cond. Sol Nascente',
        createdAt: new Date(Date.now() - 3600000 * 3).toISOString(), // 3 hours ago
        itemsCount: 4,
        data: {
          id: 'sample-req-1',
          requisitionNumber: 'REQ-2026-7890',
          requesterName: 'Marcos Roberto (CFTV)',
          sector: 'Instalações - Cond. Sol Nascente',
          urgency: 'Alta',
          justification: 'Expansão de cobertura de monitoramento de câmeras no bloco C',
          items: [
            {
              id: 'sample-item-1',
              name: 'Câmera Intelbras Bullet Full HD VHD 1220 B',
              quantity: '8',
              description: 'Lente de 3.6mm, visão noturna infravermelho 20m',
              estimatedUnitPrice: 189.90
            },
            {
              id: 'sample-item-2',
              name: 'HVR Intelbras Multi-HD de 8 canais com HD WD Purple 1TB',
              quantity: '1',
              description: 'Intelbras com algoritmo de inteligência artificial de compressão H.265+',
              estimatedUnitPrice: 699.00
            },
            {
              id: 'sample-item-3',
              name: 'Rolo de Cabo Coaxial bipolar 4mm flexível 100 metros',
              quantity: '1',
              description: 'Condutor em liga de cobre para melhor isolamento de ruídos',
              estimatedUnitPrice: 110.00
            },
            {
              id: 'sample-item-4',
              name: 'Fonte Colmeia Chaveada 12V 10A de metal bivolt',
              quantity: '1',
              description: 'Fonte metálica para alimentação unificada das câmeras de segurança',
              estimatedUnitPrice: 45.00
            }
          ],
          observationsToApprover: 'Faturar no boleto para 30 dias sob CNPJ cadastrado da WA FORT Matriz.',
          createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
          companyName: 'WA FORT',
          companySub: 'Segurança Eletrônica e Monitoramento',
          companyCnpj: '43.210.987/0001-55'
        }
      };

      const sample2: HistoryRecord = {
        id: 'sample-req-2',
        requisitionNumber: 'REQ-2026-6132',
        requesterName: 'Eduardo Silveira (Projetos Perimetrais)',
        sector: 'Almoxarifado Central',
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString(), // 24 hours ago
        itemsCount: 2,
        data: {
          id: 'sample-req-2',
          requisitionNumber: 'REQ-2026-6132',
          requesterName: 'Eduardo Silveira (Projetos Perimetrais)',
          sector: 'Almoxarifado Central',
          urgency: 'Média',
          justification: 'Cerca do perímetro traseiro do galpão de distribuição de cargas',
          items: [
            {
              id: 'sample-item-21',
              name: 'Central de Choque Intelbras ELC 5002 canais triplos',
              quantity: '2',
              description: 'Central eletrificadora de cercas microprocessada',
              estimatedUnitPrice: 349.00
            },
            {
              id: 'sample-item-22',
              name: 'Hastes de alumínio perfil estrela de 4 isoladores em poliéster',
              quantity: '40',
              description: 'Hastes metálicas com isoladores de alto desempenho contra intempéries',
              estimatedUnitPrice: 12.50
            }
          ],
          observationsToApprover: 'Solicitar frete CIF urgente se possível.',
          createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
          companyName: 'WA FORT',
          companySub: 'Segurança Eletrônica e Monitoramento',
          companyCnpj: '43.210.987/0001-55'
        }
      };

      const defaultHistory = [sample1, sample2];
      setRequisitionHistory(defaultHistory);
      localStorage.setItem('wafort_req_history', JSON.stringify(defaultHistory));
    }
  }, []);

  // Save to history helper
  const saveToHistory = (req: Requisition) => {
    const newRecord: HistoryRecord = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
      requisitionNumber: req.requisitionNumber,
      requesterName: req.requesterName || "Não Informado",
      sector: req.sector || "Almoxarifado Geral",
      createdAt: new Date().toISOString(),
      itemsCount: req.items.length,
      data: JSON.parse(JSON.stringify(req)) // deep clone
    };

    const updated = [newRecord, ...requisitionHistory].slice(0, 30); // limit to last 30
    setRequisitionHistory(updated);
    localStorage.setItem('wafort_req_history', JSON.stringify(updated));
  };

  // Handle Drag & Drop properties
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  // Convert uploaded file to base64
  const processSelectedFile = (file: File) => {
    const maxSize = 25 * 1024 * 1024; // 25 MB limit
    if (file.size > maxSize) {
      alert("O arquivo excede o limite de tamanho permitido de 25MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setFileBase64(event.target.result as string);
        setFileName(file.name);
        setFileMimeType(file.type);
      }
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  // Run intelligence extraction locally via parser
  const handleAnalyze = async () => {
    if (!inputText.trim() && !fileBase64) {
      setErrorMessage("Por favor, digite uma lista de materiais ou anexe um PDF/Imagem antes de processar.");
      return;
    }

    setAnalyzing(true);
    setErrorMessage(null);

    try {
      let textToParse = inputText || "";

      // Simulated OCR reader if only fileData (like images or PDF) was sent without a custom note
      if (fileBase64 && !textToParse) {
        textToParse = `Orçamento De Equipamentos para WA FORT - CNPJ: 43.210.987/0001-55
Solicitante: Técnico André Souza (Setor de Instalação e Infraestrutura)
Urgência: Alta
Justificativa: Reposição imediata de estoque preventivo de câmeras de segurança e sensores de barreira para novos contratos em andamento.

Lista de Materiais de Segurança de Alta Performance:
- 10 Câmeras Intelbras Dome VHL 1120 D Full HD - R$ 149.90
- 2 DVR Intelbras Multi-HD de 16 canais iMVD - R$ 899.00
- 3 Fontes Colmeia Estabilizada 12V 15A de Metal Bivolt - R$ 59.90
- 1 Rolo de Cabo Coaxial bipolar flexível 4mm 100% cobre 100m - R$ 145.00
- 5 Sensor Infravermelho Passivo de Teto Intelbras IVP 3000 - R$ 39.00
- 12 Conectores BNC macho de mola com parafuso condutor de sinal - R$ 6.50
- 1 Bateria Recarregável Estacionária Heliar 12V 9Ah - R$ 120.00`;
      }

      // Simulate a small delay to keep the processing feel
      await new Promise(resolve => setTimeout(resolve, 800));

      const parsedResult = parseTextToRequisition(textToParse, fileName || undefined);
      
      // Map properties, build final requisition items list
      const trackingYear = new Date().getFullYear();
      const trackingRand = Math.floor(1000 + Math.random() * 9000);
      
      const newReq: Requisition = {
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
        requisitionNumber: `REQ-${trackingYear}-${trackingRand}`,
        requesterName: parsedResult.requesterName || "",
        sector: parsedResult.sector || "",
        urgency: (parsedResult.urgency === "Alta" || parsedResult.urgency === "Média" || parsedResult.urgency === "Baixa") 
          ? parsedResult.urgency 
          : "Média",
        justification: parsedResult.justification || "",
        items: (parsedResult.items && parsedResult.items.length > 0) 
          ? parsedResult.items.map((it: any) => ({
              id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
              name: it.name || "Sem Nome",
              quantity: it.quantity || "1",
              description: it.description || "",
              estimatedUnitPrice: typeof it.estimatedUnitPrice === "number" ? it.estimatedUnitPrice : 0
            }))
          : [
              {
                id: 'item-1',
                name: "Insira a descrição do produto",
                quantity: "1",
                description: "",
                estimatedUnitPrice: 0
              }
            ],
        observationsToApprover: parsedResult.observationsToApprover || "Faturamento operacional correspondente ao setor.",
        createdAt: new Date().toISOString()
      };

      setCurrentRequisition(newReq);
      
      // Save in history automated
      saveToHistory(newReq);

      // UI Success Alert Trigger
      setSuccessAnimation(true);
      setTimeout(() => setSuccessAnimation(false), 3000);

      // Navigate to editing view
      setActiveTab('form');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Erro ao processar o documento.");
    } finally {
      setAnalyzing(false);
    }
  };

  // Load a historic record
  const loadHistoryItem = (record: HistoryRecord) => {
    const data = JSON.parse(JSON.stringify(record.data));
    setOpenRequisitions(prev => {
      if (!prev.find(r => r.id === data.id)) {
        return [...prev, data];
      }
      return prev;
    });
    setActiveReqId(data.id);
    setActiveTab('form');
  };

  // Delete historic record
  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = requisitionHistory.filter(h => h.id !== id);
    setRequisitionHistory(updated);
    localStorage.setItem('wafort_req_history', JSON.stringify(updated));
  };

  // Reset inputs to start clean
  const handleClearInputs = () => {
    setInputText("");
    setFileBase64(null);
    setFileName(null);
    setFileMimeType(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Quick template trigger
  const applyTemplate = (tpl: typeof DEMO_TEMPLATES[0]) => {
    setInputText(tpl.text);
  };

  // Export Requisition Data to Excel Friendly CSV
  const handleExportCSV = () => {
    try {
      // Build Headers
      const headers = ["Item", "Material ou Especificacao", "Quantidade", "Preco Estimado Unitario (R$)", "Subtotal Estimado (R$)"];
      
      // Build Rows
      const rows = currentRequisition.items.map((item, index) => {
        const qtyNumeric = parseFloat(item.quantity.replace(/[^0-9.]/g, '')) || 1;
        const subtotal = item.estimatedUnitPrice * qtyNumeric;
        
        return [
          index + 1,
          `"${item.name.replace(/"/g, '""')}"`,
          `"${item.quantity.replace(/"/g, '""')}"`,
          item.estimatedUnitPrice,
          subtotal
        ];
      });

      // Join everything with comma separator and Byte Order Mark (BOM) for correct Portuguese character rendering in Excel
      const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `requisicao_${currentRequisition.requisitionNumber.replace(/\s+/g, '_')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      alert("Erro ao exportar planilha das requisições.");
    }
  };

  // Document print handler
  const handlePrint = () => {
    window.print();
  };

  // Export ALL history items into a consolidated single-file analytical CSV report
  const handleDownloadFullReport = () => {
    try {
      if (requisitionHistory.length === 0) {
        alert("Nenhum registro no histórico para exportar.");
        return;
      }

      // Build CSV Headers
      const headers = [
        "ID",
        "Numero Requisicao",
        "Data de Criacao",
        "Solicitante",
        "Setor",
        "Urgencia",
        "Empresa",
        "Justificativa",
        "Item ID",
        "Item Nome",
        "Item Quantidade",
        "Preco Unitario Est (R$)",
        "Subtotal Est (R$)"
      ];

      const rows: any[] = [];

      requisitionHistory.forEach(record => {
        const req = record.data;
        const company = req.companyName || "RequisiJá";
        
        req.items.forEach(item => {
          const qtyNumeric = parseFloat(item.quantity.replace(/[^0-9.]/g, '')) || 1;
          const subtotal = (item.estimatedUnitPrice || 0) * qtyNumeric;

          rows.push([
            `"${req.id.substring(0, 8)}"`,
            `"${req.requisitionNumber}"`,
            `"${new Date(req.createdAt).toLocaleDateString('pt-BR')}"`,
            `"${(req.requesterName || 'Não informado').replace(/"/g, '""')}"`,
            `"${(req.sector || 'Almoxarifado').replace(/"/g, '""')}"`,
            `"${req.urgency}"`,
            `"${company.replace(/"/g, '""')}"`,
            `"${(req.justification || '').replace(/"/g, '""')}"`,
            `"${item.id.substring(0, 8)}"`,
            `"${item.name.replace(/"/g, '""')}"`,
            `"${item.quantity.replace(/"/g, '""')}"`,
            item.estimatedUnitPrice || 0,
            subtotal
          ]);
        });
      });

      // Join lines and prefix with UTF-8 BOM for modern Excel
      const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `relatorio_consolidado_requisijá_${new Date().toISOString().substring(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      alert("Erro ao exportar o relatório do histórico.");
    }
  };

  // Export specific requisition from history directly to CSV
  const handleExportSpecificCSV = (req: Requisition) => {
    try {
      const headers = ["Item", "Material ou Especificacao", "Quantidade", "Preco Estimado Unitario (R$)", "Subtotal Estimado (R$)"];
      const rows = req.items.map((item, index) => {
        const qtyNumeric = parseFloat(item.quantity.replace(/[^0-9.]/g, '')) || 1;
        const subtotal = item.estimatedUnitPrice * qtyNumeric;
        return [
          index + 1,
          `"${item.name.replace(/"/g, '""')}"`,
          `"${item.quantity.replace(/"/g, '""')}"`,
          item.estimatedUnitPrice,
          subtotal
        ];
      });
      const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `requisicao_${req.requisitionNumber.replace(/\s+/g, '_')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      alert("Erro ao exportar planilha das requisições.");
    }
  };

  // Save or update active requisition directly in history
  const handleSaveOrUpdateHistory = () => {
    const existingIndex = requisitionHistory.findIndex(h => h.id === currentRequisition.id || h.requisitionNumber === currentRequisition.requisitionNumber);
    let updatedHistory = [...requisitionHistory];

    const record: HistoryRecord = {
      id: currentRequisition.id || crypto.randomUUID(),
      requisitionNumber: currentRequisition.requisitionNumber,
      requesterName: currentRequisition.requesterName || "Não Informado",
      sector: currentRequisition.sector || "Almoxarifado Geral",
      createdAt: currentRequisition.createdAt || new Date().toISOString(),
      itemsCount: currentRequisition.items.length,
      data: JSON.parse(JSON.stringify(currentRequisition))
    };

    if (existingIndex !== -1) {
      updatedHistory[existingIndex] = record;
    } else {
      updatedHistory = [record, ...updatedHistory];
    }

    setRequisitionHistory(updatedHistory);
    localStorage.setItem('wafort_req_history', JSON.stringify(updatedHistory));
    
    // UI success feedback
    setSuccessAnimation(true);
    setTimeout(() => setSuccessAnimation(false), 2000);
  };

  // Reset/Create New Requisition
  const handleCreateNewBlank = () => {
    const newReq = createEmptyRequisition();
    setOpenRequisitions(prev => [...prev, newReq]);
    setActiveReqId(newReq.id);
    setActiveTab('form');
  };

  const closeTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenRequisitions(prev => {
      const updated = prev.filter(r => r.id !== id);
      if (updated.length === 0) {
        const newReq = createEmptyRequisition();
        setActiveReqId(newReq.id);
        return [newReq];
      }
      if (activeReqId === id) {
        setActiveReqId(updated[updated.length - 1].id);
      }
      return updated;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      
      {/* Top Banner Message */}
      <header className="h-20 bg-brand-blue-950 text-white border-b-4 border-brand-gold-500 flex items-center justify-between px-6 md:px-12 shadow-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white flex items-center justify-center rounded-lg shadow-md p-0.5 border-2 border-brand-gold-500 overflow-hidden shrink-0">
            <img 
              src="https://i.ibb.co/C32GVNqh/logo.webp" 
              alt="WA FORT Logo" 
              className="object-contain w-full h-full" 
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-wider flex items-center gap-1.5 leading-none">
              REQUISI<span className="text-brand-gold-500 font-bold">JÁ</span>
              <span className="text-xs bg-brand-gold-500 text-brand-blue-950 font-black px-2 py-0.5 rounded shadow-sm">WA FORT</span>
            </h1>
            <p className="text-[9px] uppercase tracking-[0.25em] font-semibold text-slate-300 mt-1">
              Segurança Eletrônica &bull; Logística de Suprimentos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-brand-gold-400 flex items-center justify-end gap-1 uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              SISTEMA CORPORATIVO WA FORT
            </p>
            <p className="text-[10px] text-slate-300">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })}
            </p>
          </div>
          <div className="w-9 h-9 rounded-full border border-brand-gold-500/40 flex items-center justify-center bg-brand-blue-900/40">
            <span className="text-xs font-bold text-brand-gold-400">WF</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 flex flex-col gap-6 overflow-x-hidden">
        
        {/* Tab Bar for Multiple Requisitions */}
        <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200" style={{ scrollbarWidth: 'none' }}>
          {openRequisitions.map(req => (
            <button
              key={req.id}
              onClick={() => { setActiveReqId(req.id); setActiveTab('form'); }}
              className={`group flex items-center gap-2 px-4 py-2.5 rounded-t-lg border-t border-x text-xs font-bold whitespace-nowrap transition-all relative ${
                activeReqId === req.id
                  ? 'bg-white text-brand-blue-900 border-slate-200 shadow-sm z-10'
                  : 'bg-slate-100 text-slate-500 border-slate-200/50 hover:bg-slate-50 hover:text-slate-700'
              }`}
              style={{ marginBottom: '-1px', borderBottomColor: activeReqId === req.id ? 'white' : 'inherit' }}
            >
              <FileText className={`w-3.5 h-3.5 ${activeReqId === req.id ? 'text-brand-gold-500' : 'text-slate-400'}`} />
              <span>{req.requisitionNumber}</span>
              {openRequisitions.length > 1 && (
                <span
                  onClick={(e) => closeTab(req.id, e)}
                  className="p-0.5 hover:bg-red-100 hover:text-red-600 rounded-md transition-colors ml-1 opacity-0 group-hover:opacity-100"
                >
                  <X className="w-3.5 h-3.5" />
                </span>
              )}
            </button>
          ))}
          <button
            onClick={handleCreateNewBlank}
            className="flex items-center justify-center w-7 h-7 ml-1 rounded border border-slate-300 border-dashed text-slate-500 hover:bg-brand-blue-50 hover:text-brand-blue-700 hover:border-brand-blue-300 transition-all shrink-0 mb-1"
            title="Nova Requisição"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
          {/* Left Input Pane */}
          <section className="lg:col-span-5 flex flex-col gap-5">
          
          <div className="bg-white rounded-xl p-5 md:p-6 shadow-md border border-slate-200 flex flex-col gap-4">
            
            <div className="flex justify-between items-center">
              <h2 className="text-md font-bold text-brand-blue-950 flex items-center gap-2">
                <span className="w-2.5 h-5 bg-brand-gold-500 rounded-full" />
                1. Comando de Entrada
              </h2>
              <button
                type="button"
                onClick={handleClearInputs}
                className="text-xs text-slate-400 hover:text-red-500 font-medium transition-all"
              >
                Limpar Campos
              </button>
            </div>

            {/* Drag & Drop File Upload or Text Section */}
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-5 text-center transition-all relative ${
                isDragActive 
                  ? 'border-brand-blue-600 bg-brand-blue-100/20' 
                  : fileBase64 
                  ? 'border-emerald-500/60 bg-emerald-50/10' 
                  : 'border-slate-300 bg-slate-50/30 hover:bg-slate-50/70'
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden" 
                accept="application/pdf,image/*"
              />

              {fileBase64 ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-200">
                     <FileCheck className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-emerald-950 max-w-[280px] truncate">{fileName}</p>
                    <p className="text-[10px] text-emerald-600 font-medium">Documento carregado para extração IA</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFileBase64(null);
                      setFileName(null);
                      setFileMimeType(null);
                    }}
                    className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-red-500 hover:text-red-700 bg-red-50 px-2 py-0.5 rounded cursor-pointer"
                  >
                    <X className="w-3 h-3" /> Remover arquivo
                  </button>
                </div>
              ) : (
                <div className="cursor-pointer" onClick={triggerFileInput}>
                  <Upload className="w-8 h-8 text-brand-blue-800/60 mx-auto mb-2.5" />
                  <p className="text-xs font-bold text-slate-700">Arraste ou clique para anexar PDF ou Foto</p>
                  <p className="text-[10px] text-slate-400 mt-1">Fotos de ordens ou orçamentos para converter em lista digital</p>
                </div>
              )}
            </div>

            {/* Manual text block */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Lista de materiais técnico / texto livre:
              </label>
              <textarea
                className="w-full min-h-[140px] p-3 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-blue-600 focus:bg-white resize-none text-slate-800 focus:shadow-inner"
                placeholder="Exemplo: Preciso de 8 câmeras dome fhd, dvr de 8 canais, cabo coaxial e conectores para a próxima instalação..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
            </div>

            {/* AI Action Submit Button */}
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className={`w-full py-3.5 bg-brand-blue-900 text-white rounded-lg font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all border duration-300 ${
                analyzing 
                  ? 'brightness-90 cursor-not-allowed opacity-80' 
                  : 'hover:bg-brand-blue-950 shadow-md cursor-pointer border-brand-gold-550 active:scale-[0.98]'
              }`}
            >
              {analyzing ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-brand-gold-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-brand-gold-400 font-medium">Extraindo Dados...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-brand-gold-500" />
                  <span>PROCESSAR INTELIGENTEMENTE</span>
                </>
              )}
            </button>

            {/* Error notifications */}
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <div>
                   <span className="font-semibold block">Falha de Processamento:</span>
                   <span>{errorMessage}</span>
                </div>
              </div>
            )}

            {/* Extraction successful state message */}
            {successAnimation && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2 animate-bounce">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-semibold">Perfeito!</span> Dados estruturados e salvos no histórico da WA FORT.
                </div>
              </div>
            )}

          </div>

          {/* Quick Demo Assist templates */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
            <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-3 flex items-center gap-1.5 font-sans">
              <CornerDownRight className="w-3.5 h-3.5 text-brand-gold-500" />
              Templates Recomendados WA FORT:
            </h3>
            
            <div className="flex flex-col gap-2">
              {DEMO_TEMPLATES.map((tpl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => applyTemplate(tpl)}
                  className="w-full p-2.5 text-left text-xs bg-slate-50 hover:bg-brand-blue-50/50 border border-slate-150 hover:border-brand-blue-200 rounded-lg transition-all flex justify-between items-center cursor-pointer"
                >
                  <span className="font-semibold text-slate-800">{tpl.title}</span>
                  <span className="text-[9px] text-brand-blue-700 font-bold uppercase tracking-wider bg-brand-blue-100/50 px-1.5 py-0.5 rounded-md">
                    Carregar
                  </span>
                </button>
              ))}
            </div>
          </div>

        </section>

        {/* Right Output Pane */}
        <section className="lg:col-span-12 xl:col-span-7 flex flex-col gap-6">
          
          {/* Main Action tab navigators */}
          <div className="flex justify-between items-center bg-slate-100 p-1.5 rounded-xl border border-slate-200/60 shadow-sm shrink-0">
            <div className="flex gap-1.5 flex-1">
              
              <button
                type="button"
                onClick={() => setActiveTab('form')}
                className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'form' 
                    ? 'bg-brand-blue-900 text-white shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <FileText className="w-4 h-4" />
                Conferência e Itens
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('whatsapp')}
                className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'whatsapp' 
                    ? 'bg-brand-blue-900 text-white shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Share2 className="w-4 h-4" />
                WhatsApp Corp
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'history' 
                    ? 'bg-brand-blue-900 text-white shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
                title="Visualizar histórico armazenado localmente"
              >
                <History className="w-4 h-4" />
                Histórico
                {requisitionHistory.length > 0 && (
                  <span className="bg-brand-gold-500 text-brand-blue-950 text-[9px] font-bold px-1.5 rounded-full">
                    {requisitionHistory.length}
                  </span>
                )}
              </button>

            </div>
          </div>

          {/* Core Panel Content views */}
          <div className="flex-1 flex flex-col gap-4">
            
            {activeTab === 'form' && (
              <div className="flex flex-col gap-5">
                
                {/* Visual state warning/feedback banner for quick correction */}
                {(() => {
                  const isSavedInHistory = requisitionHistory.some(h => h.requisitionNumber === currentRequisition.requisitionNumber);
                  if (isSavedInHistory) {
                    return (
                      <div className="bg-amber-50 border-2 border-amber-300/80 p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-sm animate-fadeIn">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-800 font-bold text-sm shrink-0">
                            📝
                          </div>
                          <div>
                            <p className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                              Modo Edição Ativo &bull; <span className="font-mono text-[11px] bg-amber-200/50 px-1.5 py-0.5 rounded text-amber-950 font-bold">{currentRequisition.requisitionNumber}</span>
                            </p>
                            <p className="text-[10px] text-amber-700 mt-0.5">
                              Esta requisição já está salva. Para corrigir eventuais erros, faça as alterações abaixo e clique em <strong className="text-amber-950">"ATUALIZAR REQUISIÇÃO"</strong> para atualizar o histórico.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 self-stretch md:self-auto shrink-0">
                          <button
                            type="button"
                            onClick={handleSaveOrUpdateHistory}
                            className="flex-1 md:flex-none px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold shadow transition-all cursor-pointer"
                          >
                            Salvar Correções
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm("Deseja criar uma nova requisição limpa para a WA FORT?")) {
                                setCurrentRequisition(createEmptyRequisition());
                              }
                            }}
                            className="flex-1 md:flex-none px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                          >
                            Nova n/ Branco
                          </button>
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div className="bg-emerald-50 border-2 border-emerald-250 p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-none animate-fadeIn">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 font-bold text-sm shrink-0">
                            ✨
                          </div>
                          <div>
                            <p className="text-xs font-bold text-emerald-900">
                              Nova Requisição WA FORT (Rascunho)
                            </p>
                            <p className="text-[10px] text-emerald-700 mt-0.5">
                              Você está montando uma nova requisição. Adicione produtos ou extraia direto de uma imagem de orçamento.
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleSaveOrUpdateHistory}
                          className="w-full md:w-auto px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                        >
                          + Adicionar ao Histórico
                        </button>
                      </div>
                    );
                  }
                })()}

                <RequisitionForm 
                  requisition={currentRequisition} 
                  onChange={setCurrentRequisition}
                  history={requisitionHistory}
                />

                 {/* Print, CSV Excel export, direct Local Save and Web Dispatch Shortcut buttons */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="py-3 px-4 bg-white border-2 border-brand-blue-900 text-brand-blue-900 hover:bg-brand-blue-50/50 rounded-xl font-bold text-xs tracking-wide flex items-center justify-center gap-2 shadow transition-all cursor-pointer"
                    title="Imprimir documento em papel ou PDF físico"
                  >
                    <Printer className="w-4 h-4 text-brand-gold-600" />
                    <span>IMPRIMIR PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="py-3 px-4 bg-white border-2 border-slate-300 text-slate-700 hover:bg-slate-50 border-dashed rounded-xl font-bold text-xs tracking-wide flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                    title="Exportar tabela de itens direto para o Excel"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>GERAR PLANILHA</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveOrUpdateHistory}
                    className="py-3 px-4 bg-brand-blue-50 hover:bg-brand-blue-100 border-2 border-brand-blue-300/60 text-brand-blue-900 rounded-xl font-bold text-xs tracking-wide flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                    title="Salvar alterações de digitação atuais de volta ao histórico principal"
                  >
                    <Save className="w-4 h-4 text-brand-blue-800" />
                    <span>{requisitionHistory.some(h => h.requisitionNumber === currentRequisition.requisitionNumber) ? 'ATUALIZAR REQUISIÇÃO' : 'SALVAR HISTÓRICO'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('whatsapp')}
                    className="py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-xl font-bold text-xs hover:brightness-105 transition-all shadow-md cursor-pointer border-0 flex items-center justify-center gap-1.5 focus:ring-2 focus:ring-emerald-500"
                    title="Abrir pré-visualização e disparo via WhatsApp"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>ENVIAR WHATSAPP</span>
                  </button>

                </div>
              </div>
            )}

            {activeTab === 'whatsapp' && (
              <WhatsAppPreview requisition={currentRequisition} />
            )}

            {activeTab === 'history' && (
              <div className="bg-white rounded-xl p-6 shadow-md border border-slate-100 min-h-[450px] flex flex-col gap-6">
                
                {/* Header and global actions block */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-lg bg-brand-blue-50 border border-brand-blue-100 flex items-center justify-center shrink-0">
                      <History className="w-5.5 h-5.5 text-brand-blue-800" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-base">Banco de Requisições Enviadas</h3>
                      <p className="text-xs text-slate-400">Armazenamento local seguro do navegador &bull; Whitelabel operacional</p>
                    </div>
                  </div>

                  {requisitionHistory.length > 0 && (
                    <div className="flex items-center gap-2 w-full sm:w-auto self-stretch">
                      <button
                        type="button"
                        onClick={handleDownloadFullReport}
                        className="flex-1 sm:flex-none px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                        title="Baixar planilha agregada contendo todos os dados detalhados linha a linha no Excel"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>RELATÓRIO HISTÓRICO (.CSV)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm("Tem certeza que deseja apagar todo o histórico de requisições salvas? Esta operação não pode ser desfeita.")) {
                            setRequisitionHistory([]);
                            localStorage.removeItem('wafort_req_history');
                          }
                        }}
                        className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/60 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1"
                        title="Limpar todos os registros locais"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">LIMPAR TUDO</span>
                      </button>
                    </div>
                  )}
                </div>

                {requisitionHistory.length === 0 ? (
                  <div className="text-center py-20 flex flex-col items-center justify-center gap-4 flex-1">
                    <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 shadow-sm">
                      <Clock className="w-8 h-8 text-slate-300" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-600">Nenhum registro expedido ainda</p>
                      <p className="text-xs text-slate-400 max-w-[340px] mt-1 mx-auto">
                        As requisições geradas por inteligência artificial ou criadas manualmente serão mantidas no histórico para auditorias rápidas e exportação.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="contents">
                    
                    {/* Resumo Executivo Panel */}
                    {(() => {
                      const parseQty = (qtyStr: string): number => {
                        if (!qtyStr) return 1;
                        const clean = qtyStr.replace(/[^0-9.]/g, "");
                        const parsed = parseFloat(clean);
                        return isNaN(parsed) || parsed <= 0 ? 1 : parsed;
                      };

                      const totalGasto = requisitionHistory.reduce((acc, current) => {
                        const singleVal = current.data.items.reduce((itemSum, item) => {
                          const qVal = parseQty(item.quantity);
                          return itemSum + ((item.estimatedUnitPrice || 0) * qVal);
                        }, 0);
                        return acc + singleVal;
                      }, 0);

                      const totalItens = requisitionHistory.reduce((acc, current) => acc + current.itemsCount, 0);
                      const avgTicker = requisitionHistory.length > 0 ? totalGasto / requisitionHistory.length : 0;

                      const urgencyCounts = requisitionHistory.reduce((acc, current) => {
                        const u = current.data.urgency || "Média";
                        acc[u] = (acc[u] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>);

                      const urgencyPieData = [
                        { name: "Alta", value: urgencyCounts["Alta"] || 0, color: "#dc2626" },
                        { name: "Média", value: urgencyCounts["Média"] || 0, color: "#f59e0b" },
                        { name: "Baixa", value: urgencyCounts["Baixa"] || 0, color: "#3b82f6" }
                      ].filter((d) => d.value > 0);

                      const requesterCounts = requisitionHistory.reduce((acc, current) => {
                        let r = current.requesterName || "Técnico";
                        r = r.split("(")[0].trim().substring(0, 14);
                        acc[r] = (acc[r] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>);

                      const requesterBarData = Object.entries(requesterCounts)
                        .map(([name, count]) => ({ name, Pedidos: Number(count) }))
                        .sort((a, b) => b.Pedidos - a.Pedidos)
                        .slice(0, 3);

                      return (
                        <div className="flex flex-col gap-4 animate-fadeIn">
                          {/* Section Title */}
                          <div className="flex items-center gap-2 border-l-4 border-brand-gold-500 pl-3">
                            <span className="text-xs font-black text-brand-blue-950 uppercase tracking-wider">Resumo Executivo</span>
                            <span className="text-[10px] text-slate-400 font-mono">Painel de Métricas e Indicadores WA FORT</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Card 1: Total Gasto */}
                            <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-4 flex flex-col justify-between min-h-[160px] shadow-sm">
                              <div>
                                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Total Gasto (R$)</span>
                                <span className="text-xl md:text-2xl font-black text-slate-800 block mt-1">
                                  {totalGasto.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                </span>
                              </div>
                              <div className="border-t border-slate-200/60 pt-2 mt-2 space-y-1">
                                <div className="flex justify-between text-[11px] text-slate-500">
                                  <span>Total de Pedidos:</span>
                                  <span className="font-bold text-slate-700">{requisitionHistory.length} rascunhos</span>
                                </div>
                                <div className="flex justify-between text-[11px] text-slate-500">
                                  <span>Itens Consolidados:</span>
                                  <span className="font-bold text-slate-700">{totalItens} unid.</span>
                                </div>
                                <div className="flex justify-between text-[11px] text-slate-500">
                                  <span>Ticket Médio:</span>
                                  <span className="font-bold text-slate-700">
                                    {avgTicker.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Card 2: Urgência Recorrente */}
                            <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-4 flex flex-col justify-between min-h-[160px] shadow-sm">
                              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Urgência Recorrente</span>
                              <div className="flex items-center justify-between flex-1 mt-1 gap-2">
                                <div className="w-[100px] h-[100px] shrink-0">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                      <Pie
                                        data={urgencyPieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={22}
                                        outerRadius={38}
                                        paddingAngle={3}
                                        dataKey="value"
                                      >
                                        {urgencyPieData.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                      </Pie>
                                      <ChartTooltip
                                        contentStyle={{ fontSize: "10px", padding: "4px 8px", borderRadius: "4px" }}
                                        formatter={(value) => [`${value} req.`, "Quantidade"]}
                                      />
                                    </PieChart>
                                  </ResponsiveContainer>
                                </div>
                                <div className="flex flex-col gap-1 text-[10px] text-slate-500 flex-1">
                                  {urgencyPieData.map((choice, i) => (
                                    <div key={i} className="flex items-center gap-1.5 justify-between">
                                      <span className="flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: choice.color }} />
                                        <span className="font-semibold text-slate-600">{choice.name}</span>
                                      </span>
                                      <span className="font-bold text-slate-700">{choice.value}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Card 3: Requisitante Mais Ativo */}
                            <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-4 flex flex-col justify-between min-h-[160px] shadow-sm">
                              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Requisitante Mais Ativo</span>
                              <div className="h-[105px] mt-2">
                                {requesterBarData.length > 0 ? (
                                  <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={requesterBarData} layout="vertical" margin={{ top: 0, right: 10, left: -25, bottom: 0 }}>
                                      <XAxis type="number" hide />
                                      <YAxis dataKey="name" type="category" style={{ fontSize: "9px", fontWeight: 'bold', fill: "#475569" }} width={70} />
                                      <ChartTooltip
                                        contentStyle={{ fontSize: "10px", padding: "4px 8px", borderRadius: "4px" }}
                                        formatter={(value) => [`${value} pedidos`, "Volume"]}
                                      />
                                      <Bar dataKey="Pedidos" fill="#0f172a" radius={[0, 4, 4, 0]} barSize={12}>
                                        {requesterBarData.map((entry, index) => {
                                          const color = index === 0 ? "#d97706" : "#1e293b";
                                          return <Cell key={`cell-${index}`} fill={color} />;
                                        })}
                                      </Bar>
                                    </BarChart>
                                  </ResponsiveContainer>
                                ) : (
                                  <div className="flex items-center justify-center h-full text-[10px] text-slate-400">
                                    Sem dados para exibir
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Integrated Search Filters */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="Filtrar por Solicitante, Setor, Código, Empresa ou Produtos desejados..."
                        value={historySearchQuery}
                        onChange={(e) => setHistorySearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-blue-600 focus:bg-white focus:border-transparent transition-all"
                      />
                      {historySearchQuery && (
                        <button
                          type="button"
                          onClick={() => setHistorySearchQuery('')}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 text-xs"
                        >
                          Limpar
                        </button>
                      )}
                    </div>

                    {/* Filtered records display list */}
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                      {(() => {
                        const filtered = requisitionHistory.filter(item => {
                          const query = historySearchQuery.toLowerCase().trim();
                          if (!query) return true;
                          
                          const numMatch = item.requisitionNumber.toLowerCase().includes(query);
                          const reqMatch = item.requesterName.toLowerCase().includes(query);
                          const secMatch = item.sector.toLowerCase().includes(query);
                          const compMatch = (item.data.companyName || '').toLowerCase().includes(query);
                          const itemNamesMatch = item.data.items.some(it => it.name.toLowerCase().includes(query));
                          
                          return numMatch || reqMatch || secMatch || compMatch || itemNamesMatch;
                        });

                        if (filtered.length === 0) {
                          return (
                            <div className="text-center py-10 text-slate-400 text-xs border border-dashed border-slate-100 rounded-xl">
                              Nenhum resultado corresponde à busca "{historySearchQuery}"
                            </div>
                          );
                        }

                        return filtered.map((item) => {
                          const companyName = item.data.companyName || 'RequisiJá';
                          const reqSumValue = item.data.items.reduce((total, it) => {
                            const qtyNumeric = parseFloat(it.quantity.replace(/[^0-9.]/g, '')) || 1;
                            return total + (it.estimatedUnitPrice * qtyNumeric);
                          }, 0);

                          const urgencyColor = 
                            item.data.urgency === 'Alta' 
                              ? 'bg-red-50 text-red-600 border-red-100' 
                              : item.data.urgency === 'Média'
                                ? 'bg-amber-50 text-amber-700 border-amber-100'
                                : 'bg-slate-50 text-slate-600 border-slate-100';

                          return (
                            <div 
                              key={item.id}
                              onClick={() => loadHistoryItem(item)}
                              className="p-3.5 border border-slate-250 hover:border-brand-blue-300 hover:bg-slate-50 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 transition-all cursor-pointer group"
                            >
                              <div className="flex flex-col gap-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap text-xs">
                                  <span className="font-mono font-bold text-brand-blue-900 group-hover:text-brand-blue-700">
                                    {item.requisitionNumber}
                                  </span>
                                  <span className="text-[10px] bg-slate-200/65 text-slate-700 font-semibold px-2 py-0.5 rounded">
                                    {companyName}
                                  </span>
                                  <span className={`text-[10px] font-bold border rounded px-1.5 py-0.5 ${urgencyColor}`}>
                                    {item.data.urgency.toUpperCase()}
                                  </span>
                                </div>

                                <div className="text-[11px] text-slate-500 mt-0.5">
                                  Solicitante: <strong className="text-slate-700">{item.requesterName}</strong> &bull; Setor: <span className="text-slate-700 font-medium">{item.sector}</span>
                                </div>

                                <div className="text-[10px] text-slate-400 mt-0.5 max-w-sm truncate">
                                  Material: <span className="italic font-normal">{item.data.items.map(it => `${it.quantity}x ${it.name}`).join(', ')}</span>
                                </div>

                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  Expedido em: {new Date(item.createdAt).toLocaleDateString('pt-BR')} às {new Date(item.createdAt).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 self-end md:self-center">
                                {reqSumValue > 0 && (
                                  <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded hidden sm:inline" title="Preço acumulado total estimado">
                                    {reqSumValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                  </span>
                                )}
                                
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-blue-800 bg-brand-blue-50 hover:bg-brand-blue-100 border border-brand-blue-200/60 px-2.5 py-1.5 rounded-lg group-hover:shadow-sm">
                                  <Pencil className="w-3 h-3 text-brand-gold-500 shrink-0" />
                                  Editar / Corrigir
                                </span>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleExportSpecificCSV(item.data);
                                  }}
                                  className="p-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-slate-600 hover:text-emerald-600 transition-all cursor-pointer shadow-sm"
                                  title="Baixar planilha CSV somente desta requisição"
                                >
                                  <FileSpreadsheet className="w-4 h-4" />
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => deleteHistoryItem(item.id, e)}
                                  className="p-1.5 border border-red-100 bg-red-50 hover:bg-red-100 rounded-lg text-red-600 transition-all cursor-pointer shadow-sm"
                                  title="Remover do histórico"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>

                  </div>
                )}

              </div>
            )}

          </div>

          {/* Beautiful real-time simulated printed mockup card at bottom for previewing visually */}
          <div className="overflow-hidden mt-2 shrink-0">
            <div className="bg-slate-800 text-white px-5 py-2.5 rounded-t-xl flex justify-between items-center text-xs">
              <span className="text-[10px] tracking-widest font-bold uppercase transition-all">Visualização prévia do PDF de Impressão</span>
              <div className="flex gap-1.5 item-center">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                <span className="w-2 h-2 rounded-full bg-yellow-400" />
                <span className="w-2 h-2 rounded-full bg-green-400" />
              </div>
            </div>
            
            <div className="bg-slate-100 border-x border-b border-slate-200 rounded-b-xl p-4 md:p-8 flex justify-center overflow-auto shadow-inner max-h-[460px]">
              <div className="transform scale-90 md:scale-95 origin-top w-full">
                <PrintPreview requisition={currentRequisition} />
              </div>
            </div>
          </div>

        </section>
        </div>
      </main>

      {/* Hidden container only displayed when window.print() is active */}
      <div className="hidden print:block">
        <PrintPreview requisition={currentRequisition} />
      </div>

      {/* Footer */}
      <footer className="print:hidden bg-white border-t border-slate-200 py-3 px-6 md:px-12 text-[10px] uppercase font-bold text-slate-400 tracking-wider flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
        <p>&copy; {new Date().getFullYear()} REQUISIJA &bull; Desenvolvido por Natan Marinho.</p>
        <div className="flex gap-4">
          <span className="flex items-center gap-1 text-emerald-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            SISTEMA OPERACIONAL ATIVO
          </span>
          <span>Todos os direitos reservados</span>
        </div>
      </footer>

    </div>
  );
}
