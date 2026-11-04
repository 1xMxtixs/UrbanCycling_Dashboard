import { AcceptInvitationForm } from "./components/AcceptInvitationForm"

type AcceptInvitationPageProps = {
  searchParams: Promise<{
    token?: string
  }>
}

/**
 * Obtiene el token desde el enlace recibido por correo y lo entrega al
 * componente interactivo encargado de validarlo.
 */
export default async function AcceptInvitationPage({
  searchParams,
}: AcceptInvitationPageProps) {
  const params = await searchParams

  return <AcceptInvitationForm token={params.token ?? ""} />
}
