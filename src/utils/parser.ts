import { Requisition } from '../types';

export function parseTextToRequisition(text: string, fileName?: string): any {
  const lines = text.split('\n');
  
  let requesterName = "";
  let sector = "";
  let urgency: "Alta" | "Média" | "Baixa" = "Média";
  let justification = "";
  let observationsToApprover = "";
  let items: any[] = [];

  // Match common patterns for requester
  const requesterRegexes = [
    /(?:solicitante|solicitado por|solicitado pelo técnico|quem está pedindo é o|técnico|eng|engenheiro|engenheira|eletricista)\s*:\s*([^\n,.\-_]+)/i,
    /(?:por|pelo técnico|pela engenheira|eletricista)\s+([A-Z][a-z\u00C0-\u00FF]+(?:\s+[A-Z][a-z\u00C0-\u00FF]+){0,2})/
  ];

  for (const regex of requesterRegexes) {
    const match = text.match(regex);
    if (match && match[1]) {
      requesterName = match[1].trim();
      break;
    }
  }

  // Match sector
  const sectorRegexes = [
    /(?:setor|departamento|setor de|obra|unidade|cliente)\s*:\s*([^\n,.\-_]+)/i,
    /(?:setor|depto|obra)\s+([^\n,.\-_]+)/i
  ];

  for (const regex of sectorRegexes) {
    const match = text.match(regex);
    if (match && match[1]) {
      sector = match[1].trim();
      break;
    }
  }

  // Define default values based on text keywords if none found
  const lowerText = text.toLowerCase();
  if (!sector) {
    if (lowerText.includes("cftv") || lowerText.includes("câmera") || lowerText.includes("intelbras")) {
      sector = "CFTV / Segurança Eletrônica";
    } else if (lowerText.includes("cerca") || lowerText.includes("choque") || lowerText.includes("haste")) {
      sector = "Cerca Elétrica Perimetral";
    } else if (lowerText.includes("alarme") || lowerText.includes("sensores") || lowerText.includes("iva")) {
      sector = "Sistemas de Alarme";
    } else if (lowerText.includes("ti") || lowerText.includes("tecnologia") || lowerText.includes("computador")) {
      sector = "Suporte de TI / Sede";
    } else if (lowerText.includes("elétrica")) {
      sector = "Manutenção Elétrica / Infraestrutura";
    } else {
      sector = "Instalações de Segurança";
    }
  }

  // Normalize requester name
  if (!requesterName) {
    if (lowerText.includes("marcos")) requesterName = "Marcos Roberto (CFTV)";
    else if (lowerText.includes("eduardo")) requesterName = "Eduardo Silveira (Projetos)";
    else if (lowerText.includes("lucas")) requesterName = "Lucas de Oliveira (Controle de Acesso)";
    else if (lowerText.includes("raimundo")) requesterName = "Raimundo Eletricista";
    else if (lowerText.includes("sandra")) requesterName = "Engenheira Sandra";
    else requesterName = "Técnico da WA FORT";
  }

  // Match urgency
  if (lowerText.includes("urgente") || lowerText.includes("urgência") || lowerText.includes("hoje") || lowerText.includes("emergencial") || lowerText.includes("imediato")) {
    urgency = "Alta";
  } else if (lowerText.includes("assim que puder") || lowerText.includes("reposição de estoque") || lowerText.includes("planejado") || lowerText.includes("baixo") || lowerText.includes("baixa")) {
    urgency = "Baixa";
  } else {
    urgency = "Média";
  }

  // Justification extraction
  const justificationRegexes = [
    /(?:justificativa|motivo|para|destinado a|fim de|com o objetivo de)\s*:\s*([^\n,._]+)/i,
    /(?:para instalação no|para manutenção da|para a portaria do|para o cliente)\s+([^\n,._]+)/i
  ];

  for (const regex of justificationRegexes) {
    const match = text.match(regex);
    if (match && match[1]) {
      justification = match[1].trim();
      break;
    }
  }
  if (!justification) {
    if (lowerText.includes("manutenção")) {
      justification = "Manutenção corretiva de equipamentos de segurança eletrônica";
    } else if (lowerText.includes("instalação")) {
      justification = "Nova instalação de monitoramento e controle de acesso perimetral";
    } else if (lowerText.includes("reposição")) {
      justification = "Reposição de estoque preventivo de materiais de instalação";
    } else {
      justification = "Suprimento de materiais operacionais para obras da WA FORT";
    }
  }

  // Parse items
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Skip metadata lines
    if (trimmed.toLowerCase().startsWith("solicitante") || 
        trimmed.toLowerCase().startsWith("setor") || 
        trimmed.toLowerCase().startsWith("urgência") || 
        trimmed.toLowerCase().startsWith("justificativa") ||
        trimmed.toLowerCase().startsWith("comprar para") ||
        trimmed.toLowerCase().startsWith("solicito com") ||
        trimmed.toLowerCase().startsWith("lista de") ||
        trimmed.toLowerCase().startsWith("observações") ||
        trimmed.toLowerCase().includes("orçamento de") ||
        trimmed.toLowerCase().includes("=================")) {
      continue;
    }

    // Attempt to match quantity and name
    const qtyRegex = /^(?:[-*•\s]*)\s*(\d+)\s*(?:unidades?|unids?|un?|pares?|pçs?|pcs?|rolos?|metros?|m|latas?|pares?)?\s+(?:de\s+)?([^\n$]+)/i;
    const qtyMatch = trimmed.match(qtyRegex);

    if (qtyMatch) {
      let qty = qtyMatch[1].trim();
      let itemNameAndDesc = qtyMatch[2].trim();
      let estimatedPrice = 0;

      // Extract units words if present to keep unit in quantity (e.g., "1 rolo de cabo" -> qty: "1 Rolo")
      const unitWords = ["rolo", "rolos", "metro", "metros", "m", "lata", "latas", "par", "pares", "unidade", "unidades", "pç", "pçs", "pacote", "pacotes"];
      for (const word of unitWords) {
        const wordRegex = new RegExp(`^${word}s?\\s+de\\s+`, 'i');
        if (wordRegex.test(trimmed.replace(/^[-*•\s]*\d+\s+/, ''))) {
          qty = `${qty} ${word.charAt(0).toUpperCase() + word.slice(1)}`;
          itemNameAndDesc = itemNameAndDesc.replace(wordRegex, '');
          break;
        }
      }

      // Try to find if there's a price in this line
      const priceRegex = /(?:R\$\s*|R\$\s+)?(\d+[\d.,]*)\s*$/i;
      const priceMatch = itemNameAndDesc.match(priceRegex);
      if (priceMatch && priceMatch[1]) {
        const rawPrice = priceMatch[1].replace('R$', '').trim().replace(',', '.');
        const numPrice = parseFloat(rawPrice);
        if (!isNaN(numPrice) && numPrice > 0) {
          estimatedPrice = numPrice;
          itemNameAndDesc = itemNameAndDesc.replace(priceRegex, '').trim();
          itemNameAndDesc = itemNameAndDesc.replace(/(?:\bde\b|\bpor\b|\bcustando\b|\bà\b)\s*$/, '').trim();
        }
      }

      // Separate brand / details / description if has commas or hyphens
      let cleanName = itemNameAndDesc;
      let cleanDesc = "";

      if (itemNameAndDesc.includes(' - ')) {
        const parts = itemNameAndDesc.split(' - ');
        cleanName = parts[0].trim();
        cleanDesc = parts.slice(1).join(' - ').trim();
      } else if (itemNameAndDesc.includes(', ')) {
        const parts = itemNameAndDesc.split(', ');
        cleanName = parts[0].trim();
        cleanDesc = parts.slice(1).join(', ').trim();
      }

      cleanName = cleanName.replace(/[,;.\s-_]+$/, '').trim();
      cleanDesc = cleanDesc.replace(/[,;.\s-_]+$/, '').trim();

      items.push({
        id: `parsed-item-${Math.random().toString(36).substr(2, 9)}`,
        name: cleanName,
        quantity: qty,
        description: cleanDesc,
        estimatedUnitPrice: estimatedPrice
      });
    } else {
      if (trimmed.length > 3) {
        items.push({
          id: `parsed-item-${Math.random().toString(36).substr(2, 9)}`,
          name: trimmed.replace(/^[-*•\s]*/, ''),
          quantity: "1",
          description: "",
          estimatedUnitPrice: 0
        });
      }
    }
  }

  if (items.length === 0) {
    items.push({
      id: `parsed-item-fallback`,
      name: text.length > 40 ? text.substring(0, 40) + '...' : text,
      quantity: "1",
      description: "Inserido manualmente",
      estimatedUnitPrice: 0
    });
  }

  if (lowerText.includes("boleto") || lowerText.includes("prazo") || lowerText.includes("faturamento")) {
    observationsToApprover = "Faturamento direto para o CNPJ aprovado comercialmente pela WA FORT.";
  } else {
    observationsToApprover = "Comprar preferencialmente de distribuidores oficiais WA FORT com faturamento faturado.";
  }

  return {
    id: `req-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    requisitionNumber: `REQ-WF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    requesterName: requesterName,
    sector: sector,
    urgency: urgency,
    justification: justification,
    items: items,
    observationsToApprover: observationsToApprover,
    createdAt: new Date().toISOString(),
    companyName: 'WA FORT',
    companySub: 'Segurança Eletrônica e Monitoramento',
    companyCnpj: '43.210.987/0001-55'
  };
}
