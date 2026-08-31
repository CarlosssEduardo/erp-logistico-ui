# 🖥️ ERP Logístico e Financeiro - Front-end

Este é o módulo de interface de usuário (Front-end) do sistema ERP construído para substituir operações arcaicas em planilhas de Excel por uma plataforma web responsiva, gamificada e de alta performance.

## 🛠️ Tecnologias e Ferramentas
* **React & Vite:** Motor principal da aplicação garantindo renderização ultrarrápida.
* **Tailwind CSS:** Framework de estilização utilizado para o design "Dark/Neon", garantindo responsividade em notebooks, tablets e monitores ultrawide.
* **Lucide React:** Biblioteca de iconografia vetorial minimalista.
* **Axios:** Cliente HTTP para comunicação assíncrona com a API Java.
* **jsPDF & jsPDF-AutoTable:** Motores de renderização matemática para geração nativa de PDFs corporativos sem depender de serviços externos.

## 🎨 Design e Dinâmica de Interface
A interface foi projetada com foco absoluto em usabilidade para operações de longa duração (Dark Mode nativo para conforto visual). 
O sistema utiliza **Local Storage** de forma estratégica para criar um cache de sessão: se o usuário fechar a aba acidentalmente, planilhas em processamento, metadados e preferências de colunas (ocultar/exibir) permanecem intactas. Adicionamos micro-interações, como barras de carregamento estilo "VS Code" e empty-states (telas vazias) que guiam o usuário de forma intuitiva.

## ⚙️ Principais Funcionalidades
* **Mesas de Compras Inteligentes:** Interfaces dinâmicas para análise cruzada de Telas, Baterias, Flex e Componentes, permitindo montar carrinhos de compras complexos em poucos cliques.
* **Orquestrador de PDF e WhatsApp:** O sistema gera Ordens de Compra (Purchase Orders) em PDF com múltiplos logotipos em qualidade absoluta (via conversão Canvas para preservação de transparência) e extrai listas de pedidos direto para a área de transferência (WhatsApp).
* **Gamificação de Metas (Dino Mode):** O dashboard de "Venda Mensal" conta com uma barra de progresso interativa onde um "Macaquinho" reage dinamicamente (de preocupado a celebrando) conforme o percentual da meta de faturamento é atingido.
* **Leitor Inteligente "Não Vem":** Uma área de triagem onde o usuário cola a resposta crua do fornecedor do WhatsApp, e o sistema varre o texto, identifica as peças em falta, risca os itens do carrinho e recalcula o valor final automaticamente.

## 🧗 Desafios Superados
O maior desafio no Front-end foi lidar com a biblioteca de PDFs (jsPDF) em conjunto com imagens modernas (`.webp` e fundos transparentes). Foi necessário desenvolver um motor de renderização interno com HTML5 Canvas para "fotografar" as logos e injetá-las no documento sem corromper as proporções ou o canal alfa (fundo preto).

---

## ⚖️ Licença e Direitos Autorais

**Copyright (c) 2026 Carlos Eduardo Ferreira Coelho. Todos os direitos reservados.**

Este software é propriedade intelectual exclusiva de Carlos Eduardo Ferreira Coelho. É estritamente **PROIBIDA** a cópia, reprodução, distribuição, engenharia reversa, modificação ou uso não autorizado, parcial ou integral, deste código-fonte e de seus recursos visuais, sob pena de responsabilização civil e criminal conforme a **Lei de Direitos Autorais (Lei Nº 9.610/98)** do Brasil.

**Contato para Aquisição e Licenciamento corporativo:**
📧 carloseduardof191@gmail.com# 🖥️ ERP Logístico e Financeiro - Front-end

Este é o módulo de interface de usuário (Front-end) do sistema ERP construído para substituir operações arcaicas em planilhas de Excel por uma plataforma web responsiva, gamificada e de alta performance.

## 🛠️ Tecnologias e Ferramentas
* **React & Vite:** Motor principal da aplicação garantindo renderização ultrarrápida.
* **Tailwind CSS:** Framework de estilização utilizado para o design "Dark/Neon", garantindo responsividade em notebooks, tablets e monitores ultrawide.
* **Lucide React:** Biblioteca de iconografia vetorial minimalista.
* **Axios:** Cliente HTTP para comunicação assíncrona com a API Java.
* **jsPDF & jsPDF-AutoTable:** Motores de renderização matemática para geração nativa de PDFs corporativos sem depender de serviços externos.

## 🎨 Design e Dinâmica de Interface
A interface foi projetada com foco absoluto em usabilidade para operações de longa duração (Dark Mode nativo para conforto visual). 
O sistema utiliza **Local Storage** de forma estratégica para criar um cache de sessão: se o usuário fechar a aba acidentalmente, planilhas em processamento, metadados e preferências de colunas (ocultar/exibir) permanecem intactas. Adicionamos micro-interações, como barras de carregamento estilo "VS Code" e empty-states (telas vazias) que guiam o usuário de forma intuitiva.

## ⚙️ Principais Funcionalidades
* **Mesas de Compras Inteligentes:** Interfaces dinâmicas para análise cruzada de Telas, Baterias, Flex e Componentes, permitindo montar carrinhos de compras complexos em poucos cliques.
* **Orquestrador de PDF e WhatsApp:** O sistema gera Ordens de Compra (Purchase Orders) em PDF com múltiplos logotipos em qualidade absoluta (via conversão Canvas para preservação de transparência) e extrai listas de pedidos direto para a área de transferência (WhatsApp).
* **Gamificação de Metas (Dino Mode):** O dashboard de "Venda Mensal" conta com uma barra de progresso interativa onde um "Macaquinho" reage dinamicamente (de preocupado a celebrando) conforme o percentual da meta de faturamento é atingido.
* **Leitor Inteligente "Não Vem":** Uma área de triagem onde o usuário cola a resposta crua do fornecedor do WhatsApp, e o sistema varre o texto, identifica as peças em falta, risca os itens do carrinho e recalcula o valor final automaticamente.

## 🧗 Desafios Superados
O maior desafio no Front-end foi lidar com a biblioteca de PDFs (jsPDF) em conjunto com imagens modernas (`.webp` e fundos transparentes). Foi necessário desenvolver um motor de renderização interno com HTML5 Canvas para "fotografar" as logos e injetá-las no documento sem corromper as proporções ou o canal alfa (fundo preto).

---

## ⚖️ Licença e Direitos Autorais

**Copyright (c) 2026 Carlos Eduardo Ferreira Coelho. Todos os direitos reservados.**

Este software é propriedade intelectual exclusiva de Carlos Eduardo Ferreira Coelho. É estritamente **PROIBIDA** a cópia, reprodução, distribuição, engenharia reversa, modificação ou uso não autorizado, parcial ou integral, deste código-fonte e de seus recursos visuais, sob pena de responsabilização civil e criminal conforme a **Lei de Direitos Autorais (Lei Nº 9.610/98)** do Brasil.

**Contato para Aquisição e Licenciamento corporativo:**
📧 carloseduardof191@gmail.com