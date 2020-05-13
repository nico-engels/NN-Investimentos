#include <algorithm>
#include <chrono>
#include <clocale>
#include <cmath>
#include <fstream>
#include <iostream>
#include <map>
#include <sstream>
#include <stdexcept>
#include <string>
#include <string_view>
#include "bd/conex.h"
#include "date.h"
using namespace std;
using namespace std::chrono;
using namespace nes::bd;
using namespace date;

// Variáveis glonais
// Conexão e arquivo final
conex c;
ofstream bd_nninv_js;

// Estrutura de dados auxiliares
struct var_js
{
  bool ok = false;
  string nome_js;

  var_js() = default;
  var_js(string n) : nome_js { move(n) } { };
};

struct pessoa_js : var_js
{
  string nome;
  string apelido;

  using var_js::var_js;
};

struct banco_js : var_js
{
  string nome;
  string codigo;
  string cnpj;

  using var_js::var_js;
};

// Mapeamentos de pessoas
map<optional<string>, pessoa_js> map_pessoa {
  {{ "Nana" }, { "nana" }},
  {{ "Nico" }, { "nico" }},
};
size_t max_pessoa_nome_js = 4;

map<optional<string>, banco_js> map_banco {
  {{ "001" }, { "banco_bb" }},
  {{ "104" }, { "banco_cef" }},
  {{ "077" }, { "banco_inter" }},
  {{ "254" }, { "banco_prb" }},
  {{ "746" }, { "banco_modal" }},
  {{ "102" }, { "banco_clear" }},
  {{ "707" }, { "banco_dayc" }},
  {{ "341" }, { "banco_itau" }},
  {{ "260" }, { "banco_nub" }},
  {{ "246" }, { "banco_abc" }},
};
size_t max_banco_nome_js = 11;

map<optional<string>, string> map_agrup_lcto;

// Funções para cada tabela
void exportar_pessoa();
void exportar_banco();
void exportar_agrup_lcto();
void exportar_cta_apl_lcto();

int main()
{
    setlocale(LC_ALL, "Portuguese");

    cout << "nn-inv:\nIniciando exportação...\n";

    // Configurações globais
    // Conexão ao bd
    cout << "Conectando... ";
    c.conectar();
    //c.conectar("localhost", 3306, "nninv_nodeusr", "123");
    c.exec_sql("USE nn_inv");
    c.exec_sql("SET NAMES 'utf8'");
    cout << "Ok\n";

    // Abertura do arquivo de escrita dos dados do BD
    cout << "Abrindo arquivo para escrita... ";

    bd_nninv_js.open("exp/" + format("%Y%m%d", system_clock::now() - 3h) + "_nn-inv_bd.js", ofstream::binary);
    if (!bd_nninv_js)
      throw runtime_error { "Não foi possível abrir o arquivo 'nn-inv_bd.js' para escrita!" };
    cout << "Ok\n";

    // Gravar o cabeçalho do arquivo
    cout << "Escrever o prelúdio... ";
    if (ifstream cabecalho { "exp/preludio.js" })
    {
      if (!(bd_nninv_js << cabecalho.rdbuf()))
      {
        bd_nninv_js.clear();
        cout << "Ok (prelúdio vazio)\n";
      }
      else
        cout << "Ok\n";
    }
    else
      throw runtime_error { "Não foi possível abrir o arquivo 'npreludio.js' para leitura!" };

    // Exportar dados
    cout << "Exportar pessoa... ";
    exportar_pessoa();
    cout << "Ok\n";

    cout << "Exportar banco... ";
    exportar_banco();
    cout << "Ok\n";

    cout << "Exportar agrupamentos de lançamentos... ";
    exportar_agrup_lcto();
    cout << "Ok\n";

    // Aplicação no BD via js
    bd_nninv_js << "Promise.all([p]).then(() => {\n"
                << "  var ps = []\n";
    for (const auto& [c, p] : map_pessoa)
      bd_nninv_js << "  ps.push(pessoa.create(" << p.nome_js << string(max_pessoa_nome_js - p.nome_js.size(), ' ')
                  << ").then((p) => " << p.nome_js << ".id " << string(max_pessoa_nome_js - p.nome_js.size(), ' ') << "= p.id))\n";
    bd_nninv_js << '\n';

    for (const auto& [c, b] : map_banco)
      bd_nninv_js << "  ps.push(banco.create(" << b.nome_js << string(max_banco_nome_js - b.nome_js.size(), ' ')
                  << ").then((b) => " << b.nome_js << ".id " << string(max_banco_nome_js - b.nome_js.size(), ' ') << "= b.id))\n";
    bd_nninv_js << '\n';

    bd_nninv_js << "  agrup_lcto.forEach((al) => {\n"
                << "    ps.push(grupo_lancamento.create(al).then((bal) => al.id = bal.id))\n"
                << "  })\n"
                << "\n";

    cout << "Exportar contas, aplicações e lançamentos...";
    exportar_cta_apl_lcto();
    cout << "Ok\n";

    /* // Para imprimir rs
    for (const auto& d : rs.cols())
      cout << d << ' ';
    cout << '\n';

    for (size_t i = 0; i < rs.cols().size(); i++) {
      for (size_t j = 0; j < rs.qtde_lins(); j++)
        cout << rs[{i, j}].value_or("<N>") << ' ';
      cout << '\n';
    }
    */
}

void exportar_pessoa()
{
    // Extrai dados
    auto rs = c.cons_sql<2>("SELECT apelido, nome FROM pessoa");

    // Validações
    if (map_pessoa.size() != rs.qtde_lins())
      throw runtime_error { "Mapeamento tabela pessoa não bate: quantidade!" };

    for (size_t i = 0; i < rs.qtde_lins(); i++) {
      const auto& apelido = rs[{i, 0}];
      map_pessoa[apelido].ok      = true;
      map_pessoa[apelido].nome    = rs[{i, 1}].value();
      map_pessoa[apelido].apelido = apelido.value();
    }

    size_t max_nome = 0;
    for (const auto& [c, p] : map_pessoa) {
      if (!p.ok)
        throw runtime_error { "Mapeamento tabela pessoa não bate: não ok!" };

      // Para formatação
      max_nome = max(p.nome.size(), max_nome);
    }

    // Escreve os dados
    bd_nninv_js << "// Pessoas\n";
    for (const auto& [c, p] : map_pessoa)
      bd_nninv_js << "const "     << p.nome_js << string(max_pessoa_nome_js - p.nome_js.size(), ' ') << " = { "
                  << "nome: '"    << p.nome    << "', " << string(max_nome - p.nome.size(), ' ')
                  << "apelido: '" << p.apelido << "' }\n";
    bd_nninv_js << '\n';
}

void exportar_banco()
{
    // Extrai dados
    auto rs = c.cons_sql<3>("SELECT codigo, nome, cnpj FROM banco");

    // Validações
    if (map_banco.size() != rs.qtde_lins())
      throw runtime_error { "Mapeamento tabela banco não bate: quantidade!" };

    for (size_t i = 0; i < rs.qtde_lins(); i++) {
      const auto& codigo = rs[{i, 0}];
      map_banco[codigo].ok     = true;
      map_banco[codigo].nome   = rs[{i, 1}].value();
      map_banco[codigo].cnpj   = rs[{i, 2}].value();
      map_banco[codigo].codigo = codigo.value();
    }

    size_t max_nome, max_codigo;
    max_nome = max_codigo = 0;
    for (const auto& [c, b] : map_banco) {
      if (!b.ok)
        throw runtime_error { "Mapeamento tabela banco não bate: não ok!" };

      // Para formatação
      max_nome    = max(b.nome.size(), max_nome);
      max_codigo  = max(b.codigo.size(), max_codigo);
    }

    // Escreve os dados
    bd_nninv_js << "// Bancos\n";
    for (const auto& [c, b] : map_banco)
      bd_nninv_js << "const "    << b.nome_js << string(max_banco_nome_js - b.nome_js.size(), ' ') << " = { "
                  << "nome: '"   << b.nome    << "', " << string(max_nome - b.nome.size(), ' ')
                  << "codigo: '" << b.codigo  << "', " << string(max_codigo - b.codigo.size(), ' ')
                  << "cnpj: '"   << b.cnpj    << "' }\n";
    bd_nninv_js << '\n';
}

void exportar_agrup_lcto()
{
    // Extrai dados
    auto rs = c.cons_sql<1>("SELECT id FROM grupo_lancamento");

    auto gerar_id_str = [] {
      static int id = 0;

      constexpr auto base = 26;
      size_t num_carac = id ? static_cast<size_t>(log(static_cast<double>(id)) / log(static_cast<double>(base))) + 1
                            : 1;

      string ret;
      ret.resize(num_carac);
      for (int i = 0, j = id; i < static_cast<int>(ret.size()); i++, j = (j / base))
        ret[i] = 'a' + (j % base);

      if (ret.empty())
        ret = "a";

      reverse(ret.begin(), ret.end());
      id++;
      return ret;
    };

    // Popula o mapeamento atribuindo um identificador a cada
    size_t max_agrup = 1;
    for (size_t i = 0; i < rs.qtde_lins(); i++) {
      auto id = gerar_id_str();
      max_agrup = id.size();
      map_agrup_lcto[rs[{i, 0}]] = move(id);
    }

    // Cria o conjunto para guardar os elementos
    bd_nninv_js << "// Agrupamentos de lctos\n"
                << "const agrup_lcto = [";
    auto it = map_agrup_lcto.begin();
    for (size_t i = 0; i < map_agrup_lcto.size(); i++) {
      if (!(i % 5) && i + 1 < map_agrup_lcto.size())
        bd_nninv_js << "\n  ";
      const auto& id_ger = (it++)->second;
      bd_nninv_js << "{ id_str: '" << id_ger << "'" << string(max_agrup - id_ger.size(), ' ') << " }, ";
    }
    bd_nninv_js << "\n]\n\n";
}

void exportar_cta_apl_lcto()
{
    // Tipos e constantes
    map<optional<string>, string> const_modalidade {
      { "1", "modalidade_cc" },
      { "2", "modalidade_corretora" },
      { "3", "modalidade_moeda" },
      { "4", "modalidade_poup" },
    };
    size_t max_modalidade_nome_js = 20;

    struct classe_apl_t {
      string nome_js;
      string desc;
    };
    map<optional<string>, classe_apl_t> const_classe_apl {
      { "1",  { "classe_saldo", "Saldo" }},
      { "2",  { "classe_mesversario", "Poup" }},
      { "3",  { "classe_lci", "LCI" }},
      { "4",  { "classe_lca", "LCA" }},
      { "5",  { "classe_cdb", "CDB" }},
      { "6",  { "classe_rdb", "RDB" }},
      { "7",  { "classe_cambio", "Cambio" }},
      { "8",  { "classe_fii", "FII" }},
      { "9",  { "classe_acao", "Ação" }},
      { "10", { "classe_fundo", "Fundo" }},
      { "11", { "classe_fgts", "Saldo" }},
    };
    size_t max_classe_apl_nome_js = 18;

    map<optional<string>, string> const_tipo_lcto {
      { "001", "tipo_deposito" },
      { "002", "tipo_juro" },
      { "003", "tipo_bonus" },
      { "004", "tipo_valorizacao" },
      { "005", "tipo_aluguel" },
      { "006", "tipo_dividendos" },
      { "007", "tipo_jscp" },
      { "008", "tipo_reaj_tr" },
      { "009", "tipo_venda" },
      { "100", "tipo_saque" },
      { "101", "tipo_desvalorizacao" },
      { "102", "tipo_ir" },
      { "103", "tipo_compra_ativo" },
      { "104", "tipo_corretagem" },
      { "200", "tipo_transferencia" },
      { "201", "tipo_aplicacao" },
      { "202", "tipo_resgate" },
      { "203", "tipo_resgate_parc" },
      { "204", "tipo_inventario" },
    };
    size_t max_tipo_lcto_js = 19;

    // Escreve as constantes
    bd_nninv_js << "  // Constantes\n";
    for (const auto& [v, m] : const_modalidade)
      bd_nninv_js << "  const " << m << string(max_modalidade_nome_js - m.size(), ' ') << " = " << v.value() << '\n';
    bd_nninv_js << '\n';

    for (const auto& [v, ca] : const_classe_apl)
      bd_nninv_js << "  const " << ca.nome_js << string(max_classe_apl_nome_js - ca.nome_js.size(), ' ') << " = " << v.value() << '\n';
    bd_nninv_js << '\n';

    for (const auto& [v, tl] : const_tipo_lcto)
      bd_nninv_js << "  const " << tl << string(max_tipo_lcto_js - tl.size(), ' ') << " = " << v.value() << '\n';
    bd_nninv_js << '\n';

    // Cabeçalho dos dados
    bd_nninv_js << "  Promise.all(ps).then(() => {\n"
                   "    // Resto\n"
                   "    const dados = [\n";

    // Extrai contas
    auto rs = c.cons_sql<10>("select p.apelido\n"
                             "     , b.codigo\n"
                             "     , c.alias\n"
                             "     , c.agencia\n"
                             "     , c.numero\n"
                             "     , date_format(c.inicio, '%d/%m/%Y') as inicio\n"
                             "     , date_format(c.fim, '%d/%m/%Y') as fim\n"
                             "     , c.modalidade\n"
                             "     , c.apl_padrao\n"
                             "     , c.id\n"
                             "  from conta c\n"
                             " inner join pessoa p\n"
                             "         on c.id_pessoa = p.id\n"
                             "  left join banco b\n"
                             "         on c.id_banco = b.id\n"
                             " order by p.apelido, c.inicio, c.id");

    optional<string> grp_apelido;
    for (size_t i = 0; i < rs.qtde_lins(); i++) {
      // Grupo por apelido
      if (!grp_apelido || grp_apelido != rs[{i, 0}])
      {
        // Separação de um grupo para outro
        if (grp_apelido)
          bd_nninv_js << '\n';

        grp_apelido = rs[{i, 0}];

        // Início cada grupo
        bd_nninv_js << "      // " << grp_apelido.value() << '\n';
      }

                      bd_nninv_js << "      // " << rs[{i, 2}].value() << '\n'
                                  << "      { id_pessoa:  " << map_pessoa[rs[{i, 0}]].nome_js << ".id,\n";
      if (rs[{i, 1}]) bd_nninv_js << "        id_banco:   " << map_banco[rs[{i, 1}]].nome_js << ".id,\n";
                      bd_nninv_js << "        alias:      '" << rs[{i, 2}].value() << "',\n";
      if (rs[{i, 3}]) bd_nninv_js << "        agencia:    '" << rs[{i, 3}].value() << "',\n";
      if (rs[{i, 4}]) bd_nninv_js << "        numero:     '" << rs[{i, 4}].value() << "',\n";
                      bd_nninv_js << "        inicio_str: '" << rs[{i, 5}].value() << "',\n";
      if (rs[{i, 6}]) bd_nninv_js << "        fim_str:    '" << rs[{i, 6}].value() << "',\n";
                      bd_nninv_js << "        modalidade: " << const_modalidade[rs[{i, 7}]] << ",\n";
                      bd_nninv_js << "        apl_padrao: " << const_classe_apl[rs[{i, 8}]].nome_js << ",\n";

      // Extrai aplicações
      auto rs_apl = c.cons_sql<6>("select a.classe\n"
                                  "     , a.nome\n"
                                  "     , date_format(a.inicio, '%d/%m/%Y') as inicio\n"
                                  "     , date_format(a.fim, '%d/%m/%Y') as fim\n"
                                  "     , a.dia_ref\n"
                                  "     , a.id\n"
                                  "  from aplicacao a\n"
                                  " where a.id_conta = " + rs[{i, 9}].value() + "\n"
                                  " order by a.inicio, a.id");

      if (rs_apl.qtde_lins())
        bd_nninv_js << "        aplicacoes: [\n";

      for (size_t j = 0; j < rs_apl.qtde_lins(); j++) {
        const auto& classe = const_classe_apl[rs_apl[{j, 0}]];

        bd_nninv_js << "          // " << classe.desc << ' ' << rs_apl[{j, 1}].value_or("");
        if (classe.nome_js == "classe_mesversario")
          bd_nninv_js << rs_apl[{j, 4}].value();
        if (rs_apl[{j, 3}])
          bd_nninv_js << " (encerrada)";
        bd_nninv_js << "\n";

        bd_nninv_js << "          { classe:      " << classe.nome_js << ",\n";
        if (rs_apl[{j, 1}])
          bd_nninv_js << "            nome:        '" << rs_apl[{j, 1}].value() << "',\n";
        bd_nninv_js << "            inicio_str:  '" << rs_apl[{j, 2}].value() << "',\n";
        if (rs_apl[{j, 3}])
          bd_nninv_js << "            fim_str:     '" << rs_apl[{j, 3}].value() << "',\n";
        bd_nninv_js << "            dia_ref:     " << rs_apl[{j, 4}].value() << ",\n";

        // Extrai lançamentos
        auto rs_lcto = c.cons_sql<6>("select date_format(l.data, '%d/%m/%Y') as data\n"
                                     "     , lpad(l.tipo, 3, '0') as tipo\n"
                                     "     , l.entrada\n"
                                     "     , l.saida\n"
                                     "     , l.funcao\n"
                                     "     , l.id_grupo\n"
                                     "  from lancamento l\n"
                                     " where l.id_aplicacao = " + rs_apl[{j, 5}].value() + "\n"
                                     " order by l.data, l.entrada DESC, l.saida");

        if (rs_lcto.qtde_lins())
          bd_nninv_js << "            lancamentos: [\n";

        for(size_t k = 0; k < rs_lcto.qtde_lins(); k++) {
          bd_nninv_js << "              { "
                      << "data_str: '" << rs_lcto[{k, 0}].value() << "', "
                      << "tipo: " << const_tipo_lcto[rs_lcto[{k, 1}]] << ", "
                      << "entrada: " << rs_lcto[{k, 2}].value() << ", "
                      << "saida: " << rs_lcto[{k, 3}].value() << ", "
                      << "funcao: '" << rs_lcto[{k, 4}].value() << "', ";

          if (rs_lcto[{k, 5}])
            bd_nninv_js << "id_grupo_map: '" << map_agrup_lcto[rs_lcto[{k, 5}]] << "', ";

          bd_nninv_js  << "},\n";
        }

        if (rs_lcto.qtde_lins())
          bd_nninv_js << "            ]\n";

        bd_nninv_js << "          },\n";
      }

      if (rs_apl.qtde_lins())
                      bd_nninv_js << "        ],\n";

                      bd_nninv_js << "      },\n";
    }

    // Rodapé
    bd_nninv_js << "    ]\n"
                   "\n"
                   "    let conv_data_br = (data_str) => {\n"
                   "      let arr_data_str = data_str.split('/')\n"
                   "      return new Date(Date.UTC(+arr_data_str[2], +arr_data_str[1] - 1, +arr_data_str[0]))\n"
                   "    }\n"
                   "\n"
                   "    dados.forEach((c) => {\n"
                   "\n"
                   "      c.inicio = conv_data_br(c.inicio_str)\n"
                   "      if (c.fim_str)\n"
                   "        c.fim = conv_data_br(c.fim_str)\n"
                   "\n"
                   "      conta.create(c).then((bd_c) => {\n"
                   "\n"
                   "        c.aplicacoes.forEach((a) => {\n"
                   "\n"
                   "          a.id_conta = bd_c.id\n"
                   "          a.inicio   = conv_data_br(a.inicio_str)\n"
                   "          if (a.fim_str)\n"
                   "            a.fim = conv_data_br(a.fim_str)\n"
                   "\n"
                   "          aplicacao.create(a).then((bd_a) =>\n"
                   "\n"
                   "            a.lancamentos.forEach((l) => {\n"
                   "\n"
                   "              l.id_aplicacao = bd_a.id\n"
                   "              l.funcao       = 'carga_inicial'\n"
                   "              l.data         = conv_data_br(l.data_str)\n"
                   "              if (l.id_grupo_map)\n"
                   "                l.id_grupo   = agrup_lcto.find((al) => al.id_str == l.id_grupo_map).id\n"
                   "\n"
                   "              lancamento.create(l)\n"
                   "\n"
                   "            })\n"
                   "          )\n"
                   "        })\n"
                   "      })\n"
                   "    })\n"
                   "  })\n"
                   "})\n";

}