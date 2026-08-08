/**
 * Operações de sessão e empresas — fatia 1 da integração.
 *
 * Cada documento pede **exatamente** os campos que o front usa. Campo a mais é
 * dado trafegando sem consumidor; campo a menos vira `undefined` em produção,
 * onde o mock não está mais lá para encobrir.
 */
import { gql } from '@apollo/client/core'

/** Fragmento do perfil: permissões decidem o que a UI oferece (B5). */
export const CAMPOS_PERFIL = gql`
  fragment CamposPerfil on Perfil {
    id
    nome
    descricao
    escopoGlobal
    permissoes {
      id
      chave
      descricao
      modulo
    }
  }
`

/**
 * O usuário chega com os vínculos, não com as empresas inteiras: o perfil
 * efetivo depende do vínculo da empresa ativa (REQ-09), e o cadastro completo
 * das empresas vem de `minhasEmpresas`.
 */
const CAMPOS_USUARIO = gql`
  fragment CamposUsuario on Usuario {
    id
    nome
    email
    cpf
    dataNascimento
    ativo
    empresas {
      empresaId
      perfil {
        ...CamposPerfil
      }
    }
    perfilGlobal {
      ...CamposPerfil
    }
  }
  ${CAMPOS_PERFIL}
`

export const LOGIN = gql`
  mutation login($email: String!, $senha: String!) {
    login(email: $email, senha: $senha) {
      token
      refreshToken
      expiraEmSegundos
      usuario {
        ...CamposUsuario
      }
    }
  }
  ${CAMPOS_USUARIO}
`

export const RENOVAR_SESSAO = gql`
  mutation renovarSessao($refreshToken: String!) {
    renovarSessao(refreshToken: $refreshToken) {
      token
      refreshToken
      expiraEmSegundos
      usuario {
        ...CamposUsuario
      }
    }
  }
  ${CAMPOS_USUARIO}
`

export const ENCERRAR_SESSAO = gql`
  mutation encerrarSessao {
    encerrarSessao
  }
`

export const ME = gql`
  query me {
    me {
      ...CamposUsuario
    }
  }
  ${CAMPOS_USUARIO}
`

/**
 * Já vem filtrada pelo servidor (B9) — o front não decide mais quais empresas o
 * usuário vê. `percentualDespesasFixas` é calculado lá (C2/B1) e chega pronto.
 */
export const CAMPOS_EMPRESA = gql`
  fragment CamposEmpresa on Empresa {
    id
    razaoSocial
    cnpj
    segmento
    regimeTributario
    anexoCadastrado
    faturamentoMedioMensal
    folhaPagamentoMensal
    percentualDespesasFixas
    donoUsuarioId
    fatorR
    anexoAplicado
  }
`

export const MINHAS_EMPRESAS = gql`
  query minhasEmpresas {
    minhasEmpresas {
      ...CamposEmpresa
    }
  }
  ${CAMPOS_EMPRESA}
`

/**
 * Criação e edição na mesma mutation — `input.id` nulo é criação. Quem cria vira
 * dono (R09), e o `EmpresaInput` **não tem** `donoUsuarioId`: campo que não
 * existe no contrato não pode ser forjado pelo cliente.
 */
export const SALVAR_EMPRESA = gql`
  mutation salvarEmpresa($input: EmpresaInput!) {
    salvarEmpresa(input: $input) {
      ...CamposEmpresa
    }
  }
  ${CAMPOS_EMPRESA}
`

/**
 * Stateless — não grava nada. Recebe folha/faturamento hipotéticos e devolve o
 * mesmo cálculo (C8/C9) que a empresa real teria; segmento/regime continuam os
 * cadastrados (REQ-03, resolvido 06-08-2026 só para Fator R).
 */
export const SIMULAR_FATOR_R = gql`
  query simularFatorR($empresaId: ID!, $faturamentoMedioMensal: BigDecimal!, $folhaPagamentoMensal: BigDecimal!) {
    simularFatorR(
      empresaId: $empresaId
      faturamentoMedioMensal: $faturamentoMedioMensal
      folhaPagamentoMensal: $folhaPagamentoMensal
    ) {
      fatorR
      anexoAplicado
      aplicavel
    }
  }
`
