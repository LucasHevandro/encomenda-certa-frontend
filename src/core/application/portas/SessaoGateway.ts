export interface Usuario {
  readonly id: string;
  readonly nome: string;
  readonly email: string;
}

export interface SessaoGateway {
  entrar(email: string, senha: string): Promise<Usuario>;
  sair(): Promise<void>;
  atual(): Promise<Usuario | null>;
}
