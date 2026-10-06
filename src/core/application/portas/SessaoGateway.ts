export interface Usuario {
  readonly id: string;
  readonly nome: string;
  readonly email: string;
  /** Administrador do sistema: só usa o painel de empresas. */
  readonly administrador: boolean;
}

export interface SessaoGateway {
  entrar(email: string, senha: string): Promise<Usuario>;
  sair(): Promise<void>;
  atual(): Promise<Usuario | null>;
}
