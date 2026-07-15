Atue como arquiteto de software, engenheiro de produto, especialista em logística, UX/UI e desenvolvedor full stack sênior.

Sua missão é projetar e implementar uma plataforma completa para gestão logística, acompanhamento de motoristas e comprovação digital de entregas e retiradas.

O sistema deverá ser composto por:

1. Aplicativo móvel para motoristas.
2. Painel web para gestores e operadores logísticos.
3. API backend para regras de negócio e integrações.
4. Banco de dados centralizado.
5. Serviço de armazenamento de fotos, assinaturas e comprovantes.
6. Serviço de rastreamento por GPS.
7. Sistema de notificações e atualização em tempo real.

Não desenvolva apenas telas isoladas. Estruture uma solução utilizável em ambiente empresarial, com segurança, auditoria, rastreabilidade, funcionamento offline e possibilidade de integração com ERP.

## 1. Objetivo do sistema

Criar uma plataforma que permita:

- Cadastrar motoristas, veículos, filiais, clientes e locais de entrega.
- Criar entregas, coletas e retiradas.
- Atribuir serviços aos motoristas.
- Organizar as atividades em rotas.
- Acompanhar os motoristas por GPS.
- Visualizar a situação de cada entrega em tempo real.
- Registrar a chegada do motorista ao destino.
- Fotografar o material transportado.
- Fotografar o local da entrega ou retirada.
- Coletar assinatura digital do recebedor.
- Registrar nome e documento de quem recebeu.
- Registrar data, hora e coordenadas geográficas de cada evidência.
- Gerar um comprovante digital da operação.
- Manter histórico completo e auditável.
- Integrar as ocorrências e comprovantes ao ERP da empresa.

## 2. Perfis de usuário

Implemente controle de acesso baseado em perfis e permissões.

### Administrador

Deve poder:

- Gerenciar usuários e permissões.
- Gerenciar empresas e filiais.
- Configurar parâmetros do sistema.
- Consultar logs e auditorias.
- Gerenciar integrações.
- Configurar tipos de ocorrência e motivos de insucesso.

### Gestor de logística

Deve poder:

- Cadastrar e importar entregas e retiradas.
- Criar e organizar rotas.
- Atribuir atividades aos motoristas.
- Acompanhar motoristas no mapa.
- Consultar o andamento das operações.
- Reatribuir ou cancelar atividades.
- Analisar atrasos, ocorrências e entregas malsucedidas.
- Consultar fotos, assinaturas e comprovantes.
- Acompanhar indicadores operacionais.

### Operador logístico

Deve poder:

- Criar e editar atividades.
- Consultar operações.
- Entrar em contato com o motorista.
- Registrar observações.
- Tratar ocorrências.
- Reprogramar uma entrega ou retirada, conforme sua permissão.

### Motorista

Deve poder:

- Acessar o aplicativo com autenticação segura.
- Consultar as atividades atribuídas.
- Visualizar roteiro e detalhes dos destinos.
- Iniciar e finalizar a jornada.
- Iniciar uma rota.
- Abrir a navegação até o destino.
- Atualizar o status da atividade.
- Registrar chegada ao destino.
- Fotografar o material.
- Fotografar o local.
- Coletar assinatura digital.
- Identificar a pessoa que recebeu ou entregou o material.
- Registrar ocorrências.
- Trabalhar temporariamente sem internet.
- Sincronizar os dados automaticamente quando a conexão retornar.

## 3. Tipos de operação

O sistema deve aceitar, no mínimo:

- Entrega ao cliente.
- Retirada realizada pelo cliente.
- Coleta em fornecedor.
- Coleta em cliente.
- Transferência entre filiais.
- Devolução.
- Troca de mercadoria.
- Reentrega.
- Entrega parcial.
- Retorno ao centro de distribuição.

Cada operação deverá possuir regras, campos obrigatórios e evidências configuráveis.

## 4. Cadastro da atividade logística

Cada entrega ou retirada deverá permitir os seguintes dados:

- Identificador interno.
- Empresa e filial.
- Tipo da operação.
- Número do pedido.
- Número da nota fiscal.
- Chave de acesso da NF-e.
- Cliente ou fornecedor.
- CNPJ ou CPF.
- Telefone para contato.
- Endereço completo.
- Latitude e longitude.
- Referência do local.
- Janela prevista para atendimento.
- Prioridade.
- Peso e volume da carga.
- Quantidade de volumes.
- Observações.
- Instruções especiais.
- Motorista responsável.
- Veículo utilizado.
- Rota relacionada.
- Documentos anexados.
- Status da atividade.
- Data de criação.
- Data de atribuição.
- Origem do registro: manual, importação ou integração com ERP.

Permita cadastrar manualmente, importar por planilha e receber atividades por API.

## 5. Fluxo operacional

Implemente o seguinte fluxo principal:

1. O gestor cria ou importa uma entrega ou retirada.
2. A operação é atribuída a um motorista.
3. O motorista recebe uma notificação no celular.
4. O motorista consulta as informações da atividade.
5. O motorista aceita ou informa a impossibilidade de executar o serviço.
6. O motorista inicia a rota.
7. O aplicativo começa a registrar a localização conforme as regras configuradas.
8. O gestor acompanha a movimentação pelo mapa.
9. Ao chegar ao destino, o motorista registra a chegada.
10. O aplicativo valida, quando aplicável, se o motorista está próximo das coordenadas do destino.
11. O motorista executa a entrega ou retirada.
12. O motorista registra as evidências obrigatórias.
13. O recebedor assina na tela do celular.
14. O motorista informa o nome e o documento do recebedor.
15. O motorista confirma a conclusão.
16. O sistema gera o comprovante digital.
17. O gestor visualiza a conclusão em tempo real.
18. O ERP recebe o status e o link ou identificador do comprovante.

## 6. Status das atividades

Considere, no mínimo:

- Pendente.
- Aguardando atribuição.
- Atribuída.
- Aceita pelo motorista.
- Recusada pelo motorista.
- Em rota.
- Próxima ao destino.
- Motorista no local.
- Em atendimento.
- Entregue.
- Retirada concluída.
- Concluída parcialmente.
- Não realizada.
- Reagendada.
- Cancelada.
- Retornada ao centro de distribuição.

Registre a data, hora, localização, usuário e dispositivo responsáveis por cada mudança de status.

## 7. Rastreamento por GPS

Implemente rastreamento com atenção à bateria, privacidade e conectividade.

O sistema deverá:

- Registrar localização somente durante jornadas ou rotas autorizadas.
- Permitir configurar a frequência de atualização.
- Adaptar a frequência conforme o motorista esteja parado ou em movimento.
- Enviar latitude, longitude, precisão, velocidade, direção e horário.
- Armazenar pontos temporariamente quando estiver offline.
- Sincronizar os pontos quando a conexão retornar.
- Exibir no painel a última localização conhecida.
- Informar quando ocorreu a última atualização.
- Identificar motoristas sem sinal ou sem atualização há muito tempo.
- Exibir o percurso realizado.
- Detectar chegada por geofencing.
- Registrar desvios relevantes, quando essa funcionalidade estiver habilitada.
- Manter política configurável de retenção do histórico de localização.

Não realize rastreamento permanente fora da jornada de trabalho.

## 8. Evidências da operação

Na conclusão de uma atividade, permita configurar como obrigatórias:

- Foto do material.
- Foto dos volumes.
- Foto do local.
- Foto do documento ou canhoto.
- Assinatura digital.
- Nome do recebedor.
- CPF, RG ou outro documento do recebedor.
- Grau de relacionamento do recebedor com o destinatário.
- Observações do motorista.
- Data e hora.
- Coordenadas geográficas.
- Precisão do GPS.
- Identificação do motorista e do dispositivo.

As fotos devem ser capturadas preferencialmente pela câmera do aplicativo. Caso seja permitido escolher imagens da galeria, essa ação deverá ser identificada na auditoria.

Associe cada evidência à atividade correspondente e gere um hash para ajudar a identificar alterações posteriores.

## 9. Comprovante digital

Após a conclusão, gere um comprovante em PDF contendo:

- Logotipo e identificação da empresa.
- Número da entrega ou retirada.
- Pedido e nota fiscal.
- Cliente ou fornecedor.
- Endereço do atendimento.
- Motorista e veículo.
- Data e hora da chegada.
- Data e hora da conclusão.
- Coordenadas geográficas.
- Nome e documento do recebedor.
- Assinatura digital.
- Fotos registradas.
- Ocorrências e observações.
- Código único do comprovante.
- QR Code para validação.
- Hash das evidências.
- Histórico resumido da operação.

O comprovante não deverá ser substituído silenciosamente. Qualquer correção deverá gerar uma nova versão e manter o histórico anterior.

## 10. Entrega ou retirada malsucedida

Quando a atividade não for concluída, o motorista deverá selecionar um motivo, como:

- Cliente ausente.
- Endereço não localizado.
- Endereço incorreto.
- Estabelecimento fechado.
- Recusa do recebimento.
- Material divergente.
- Material avariado.
- Falta de documentação.
- Veículo com problema.
- Área de risco.
- Falta de tempo na rota.
- Outros.

Dependendo do motivo, exija foto, comentário, localização e autorização do gestor.

Permita reagendar, reatribuir, retornar a mercadoria ou cancelar a operação.

## 11. Funcionamento offline

O aplicativo móvel deverá continuar funcionando em áreas sem internet.

Implemente:

- Armazenamento local criptografado.
- Consulta das atividades previamente sincronizadas.
- Mudança de status offline.
- Captura offline de fotos e assinaturas.
- Registro local de GPS.
- Fila de sincronização.
- Retentativas automáticas.
- Indicação visual de itens pendentes.
- Controle de duplicidade.
- Idempotência nas requisições.
- Tratamento de conflitos.
- Confirmação somente depois que o servidor receber os dados.

Nenhuma evidência poderá ser perdida caso o aplicativo seja fechado durante a sincronização.

## 12. Painel web

Crie um painel responsivo contendo:

### Dashboard

- Operações do dia.
- Entregas pendentes.
- Entregas em rota.
- Entregas concluídas.
- Entregas atrasadas.
- Entregas malsucedidas.
- Percentual de sucesso.
- Tempo médio por entrega.
- Motoristas ativos.
- Motoristas sem atualização de GPS.
- Ocorrências pendentes de tratamento.

### Mapa operacional

- Localização dos motoristas.
- Último horário de atualização.
- Situação de cada motorista.
- Destinos previstos.
- Rotas planejadas e realizadas.
- Filtros por filial, motorista, veículo, rota e status.

### Central de operações

- Lista das entregas e retiradas.
- Filtros avançados.
- Busca por pedido, nota fiscal, cliente ou motorista.
- Visualização em lista, tabela e mapa.
- Atribuição em lote.
- Reprogramação.
- Consulta das evidências.
- Download e compartilhamento do comprovante.

## 13. Notificações

Implemente notificações para:

- Nova atividade atribuída.
- Alteração ou cancelamento da atividade.
- Proximidade do horário previsto.
- Motorista chegando ao destino.
- Atividade concluída.
- Atividade malsucedida.
- Atraso.
- Motorista sem atualização de localização.
- Falha de sincronização.
- Ocorrência aguardando análise.

Avalie notificações push, e-mail e integrações com mensageria, de acordo com as configurações do sistema.

## 14. Integração com ERP

Projete uma API documentada para:

- Receber pedidos, notas fiscais, clientes e endereços.
- Criar entregas e retiradas.
- Atualizar ou cancelar atividades.
- Consultar status.
- Consultar ocorrências.
- Consultar eventos da linha do tempo.
- Obter o comprovante digital.
- Receber retorno da conclusão.
- Vincular evidências ao documento de origem.

Considere integração futura com o ERP Sankhya.

Utilize:

- API REST.
- JSON.
- Autenticação segura.
- Webhooks.
- Chaves de idempotência.
- Retentativas controladas.
- Logs de integração.
- Versionamento da API.

## 15. Segurança e LGPD

Implemente:

- Autenticação segura.
- Recuperação de senha.
- Controle de acesso por perfil e permissão.
- Tokens com expiração e renovação.
- Criptografia em trânsito e em repouso.
- Proteção dos arquivos armazenados.
- URLs temporárias para acesso às evidências.
- Registro de acessos.
- Auditoria de alterações.
- Mascaramento de documentos.
- Política de retenção e exclusão.
- Consentimento e transparência sobre o uso do GPS.
- Limitação do rastreamento ao período de trabalho.
- Bloqueio de dispositivos ou sessões comprometidas.
- Proteção contra manipulação de evidências.

Considere os princípios da LGPD desde o início da arquitetura.

## 16. Requisitos não funcionais

A solução deverá possuir:

- Arquitetura escalável.
- API versionada.
- Código modular.
- Validação de dados no frontend e backend.
- Tratamento padronizado de erros.
- Logs estruturados.
- Monitoramento de desempenho.
- Métricas e alertas.
- Testes unitários.
- Testes de integração.
- Testes end-to-end.
- Pipeline de CI/CD.
- Documentação técnica.
- Documentação da API com OpenAPI/Swagger.
- Migrações versionadas do banco de dados.
- Backup e recuperação.
- Ambientes separados de desenvolvimento, homologação e produção.

## 17. Stack tecnológica

Antes de iniciar a implementação, recomende uma stack tecnológica adequada e justifique as escolhas.

Considere como referência:

- Aplicativo móvel: React Native com Expo ou Flutter.
- Painel web: Next.js com TypeScript.
- Backend: Node.js com TypeScript, utilizando NestJS ou Fastify.
- Banco de dados: PostgreSQL com extensão PostGIS.
- Cache e filas: Redis.
- Arquivos: armazenamento compatível com S3.
- Comunicação em tempo real: WebSocket.
- Notificações: Firebase Cloud Messaging.
- Mapas: Google Maps, Mapbox ou OpenStreetMap.
- Autenticação: solução própria segura ou provedor de identidade.
- Infraestrutura: Docker.

Caso proponha tecnologias diferentes, explique os benefícios e impactos.

## 18. Modelagem de dados

Crie uma modelagem inicial contendo, no mínimo:

- Empresa.
- Filial.
- Usuário.
- Perfil.
- Permissão.
- Motorista.
- Dispositivo.
- Veículo.
- Cliente.
- Endereço.
- Atividade logística.
- Item da atividade.
- Rota.
- Parada da rota.
- Atribuição.
- Localização GPS.
- Evento da atividade.
- Evidência.
- Assinatura.
- Recebedor.
- Ocorrência.
- Motivo de insucesso.
- Comprovante.
- Notificação.
- Integração.
- Webhook.
- Log de auditoria.

Apresente as entidades, seus campos principais, relacionamentos, índices, restrições e regras de integridade.

## 19. Critérios de aceite principais

Considere a funcionalidade concluída somente quando:

- O gestor conseguir criar e atribuir uma entrega.
- O motorista receber a atividade no celular.
- A atividade continuar disponível sem internet.
- O motorista conseguir iniciar a rota.
- O gestor visualizar a última localização disponível.
- O motorista registrar chegada, fotos, recebedor e assinatura.
- A conclusão registrar data, hora e GPS.
- Os dados offline forem sincronizados sem duplicidade.
- O comprovante digital for gerado.
- O gestor conseguir visualizar e baixar o comprovante.
- O ERP puder receber a atualização por webhook ou API.
- Todas as ações relevantes ficarem registradas na auditoria.
- Usuários sem permissão não conseguirem acessar dados ou evidências restritas.

## 20. Forma de entrega da resposta

Organize sua resposta nas seguintes etapas:

1. Resumo executivo da solução.
2. Premissas e perguntas que precisam ser validadas.
3. Escopo do MVP.
4. Funcionalidades para versões futuras.
5. Personas e permissões.
6. Fluxos operacionais.
7. Regras de negócio.
8. Arquitetura da solução.
9. Escolha e justificativa da stack.
10. Modelagem do banco de dados.
11. Contratos principais da API.
12. Estratégia de GPS e funcionamento offline.
13. Segurança e conformidade com a LGPD.
14. Wireframes textuais das telas.
15. Estrutura de pastas dos projetos.
16. Plano de implementação dividido em fases.
17. Backlog em formato de épicos e histórias de usuário.
18. Critérios de aceite.
19. Estratégia de testes.
20. Estratégia de implantação e monitoramento.

Para cada história de usuário, utilize o formato:

“Como [perfil], quero [funcionalidade], para [benefício].”

Inclua critérios de aceite no formato Given/When/Then.

Não invente regras empresariais críticas sem sinalizá-las. Quando alguma decisão depender do processo da empresa, apresente as opções, recomende uma alternativa e indique o impacto da escolha.

Comece planejando a solução. Não gere todo o código em uma única resposta. Divida a implementação em módulos e fases pequenas, testáveis e executáveis.