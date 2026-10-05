import type { Usuario } from "./SessaoGateway";

export interface NovoUsuario {
  readonly nome: string;
  readonly email: string;
  readonly senha: string;
}

/** Pessoas com acesso. Todas têm as mesmas permissões. */
export interface UsuariosGateway {
  listar(): Promise<Usuario[]>;
  criar(usuario: NovoUsuario): Promise<Usuario>;
  /** Troca a senha de quem está logado. */
  mudarSenha(senhaAtual: string, novaSenha: string): Promise<void>;
}
