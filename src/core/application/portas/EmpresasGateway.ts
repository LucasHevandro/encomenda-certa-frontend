import type { Usuario } from "./SessaoGateway";
import type { NovoUsuario } from "./UsuariosGateway";

/** Um estabelecimento que usa o sistema. Desativada, ninguém dela consegue entrar. */
export interface Empresa {
  readonly id: string;
  readonly nome: string;
  readonly ativa: boolean;
  readonly criadaEm: string;
  /** Pessoas com acesso. */
  readonly usuarios: number;
}

export interface NovaEmpresa {
  readonly nome: string;
  /** Primeira pessoa com acesso; ela cadastra as outras pela tela Pessoas. */
  readonly usuario: NovoUsuario;
}

/** Painel do administrador do sistema. */
export interface EmpresasGateway {
  listar(): Promise<Empresa[]>;
  criar(nova: NovaEmpresa): Promise<{ empresa: Empresa; usuario: Usuario }>;
  mudarAtiva(id: string, ativa: boolean): Promise<Empresa>;
}
