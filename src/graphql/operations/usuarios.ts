/**
 * Operações de usuários e perfis — fatia 2 da integração.
 *
 * Duas ausências deliberadas do contrato aparecem aqui:
 *
 * - **Não existe criação direta de usuário.** O cadastro é por convite: quem
 *   convida precisa de `USUARIO_WRITE` e de alcance sobre a empresa de destino.
 * - **Não existe mutation de perfil.** `perfil` é dado de sistema, nasce no
 *   Flyway. Como PROPRIETARIO tem `PERFIL_WRITE` e o perfil é global, permitir
 *   escrita promoveria qualquer dono a administrador de toda a base.
 */
import { gql } from '@apollo/client/core'
import { CAMPOS_PERFIL } from './acesso'

export const PERFIS = gql`
  query perfis {
    perfis {
      ...CamposPerfil
    }
  }
  ${CAMPOS_PERFIL}
`

export const USUARIOS = gql`
  query usuarios {
    usuarios {
      id
      nome
      email
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
  }
  ${CAMPOS_PERFIL}
`

/**
 * `senhaProvisoria` é exibida **uma única vez**: não é recuperável depois. A UI
 * precisa dizer isso antes que o usuário feche o modal e perca a credencial de
 * outra pessoa.
 */
export const CONVIDAR_USUARIO = gql`
  mutation convidarUsuario($nome: String!, $email: String!, $empresaId: ID!, $perfilId: ID!) {
    convidarUsuario(nome: $nome, email: $email, empresaId: $empresaId, perfilId: $perfilId) {
      senhaProvisoria
      usuario {
        id
        nome
        email
        ativo
        empresas {
          empresaId
          perfil {
            ...CamposPerfil
          }
        }
      }
    }
  }
  ${CAMPOS_PERFIL}
`
