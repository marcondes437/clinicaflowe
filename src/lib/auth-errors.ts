export function authErrorMessage(error: { code?: string; status?: number } | null) {
  switch (error?.code) {
    case "email_not_confirmed": return "Confirme seu e-mail antes de entrar. Verifique também a caixa de spam ou reenvie a confirmação abaixo.";
    case "invalid_credentials": return "E-mail ou senha incorretos. Confira os dados ou use ‘Esqueci minha senha’.";
    case "email_address_invalid": case "validation_failed": return "Confira o endereço de e-mail informado.";
    case "user_already_exists": case "email_exists": return "Já existe uma conta com este e-mail. Entre ou recupere sua senha.";
    case "weak_password": return "Escolha uma senha mais forte, com pelo menos 6 caracteres.";
    case "over_email_send_rate_limit": case "over_request_rate_limit": return "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.";
    default: return error?.status === 429
      ? "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente."
      : "Não foi possível conectar ao serviço de acesso. Tente novamente em instantes.";
  }
}
