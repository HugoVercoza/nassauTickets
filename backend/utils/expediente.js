function dentroDoExpedienteServidor() {
  if (process.env.IGNORAR_EXPEDIENTE === "true") {
    return true;
  }

  const horaRecife = Number(
    new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Recife",
      hour: "2-digit",
      hour12: false,
    }).format(new Date())
  );

  return horaRecife >= 7 && horaRecife < 17;
}

module.exports = { dentroDoExpedienteServidor };