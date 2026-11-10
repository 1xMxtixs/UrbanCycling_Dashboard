"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { MailPlus, UserPlus } from "lucide-react"
import { toast } from "sonner"

import { PageHeader } from "@/components/common/PageHeader"
import { FormDialog } from "@/components/forms/FormDialog"
import { SegmentedTabs } from "@/components/forms/SegmentedTabs"
import { Button } from "@/components/ui/button"
import { Dialog, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { PERMISSIONS } from "@/lib/permissions"

import { FormCreateUsuario } from "../FormCreateUsuario"
import { FormInviteUsuario } from "../FormInviteUsuario"

type RegistrationMode = "direct" | "invitation"

const registrationTabs = [
  {
    value: "direct",
    label: "Registro directo",
    icon: UserPlus,
  },
  {
    value: "invitation",
    label: "Enviar invitación",
    icon: MailPlus,
  },
]

export function HeaderUsuarios() {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<RegistrationMode>("direct")

  const canCreate =
    session?.user?.rol === "Administrador" &&
    session.user.permisos.includes(PERMISSIONS.USERS_CREATE)

  /**
   * Controla la apertura del diálogo y restablece la modalidad inicial al
   * cerrarlo para evitar conservar formularios parciales entre aperturas.
   */
  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)

    if (!nextOpen) {
      setMode("direct")
    }
  }

  /**
   * Informa el registro directo y actualiza el listado porque el nuevo usuario
   * ya fue creado en la base de datos.
   */
  function handleCreated() {
    handleOpenChange(false)
    window.dispatchEvent(new Event("usuarios:refresh"))
    toast.success("Usuario registrado correctamente.")
  }

  /**
   * Informa el envío de la invitación sin actualizar el listado, porque la
   * cuenta todavía no existe hasta que el destinatario complete el registro.
   */
  function handleInvitationSent(email: string) {
    handleOpenChange(false)
    toast.success(`Invitación enviada a ${email}.`)
  }

  return (
    <PageHeader
      title="Gestión de Usuarios"
      description="Administra los accesos, roles y permisos de las cuentas registradas en el sistema."
    >
      {canCreate && (
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button className="cursor-pointer rounded-xl font-semibold shadow-xs">
              <UserPlus className="size-4" aria-hidden="true" />
              Registrar usuario
            </Button>
          </DialogTrigger>

          <FormDialog
            title="Agregar usuario"
            description="Registra una cuenta directamente o envía una invitación para que la persona complete sus datos."
            size="2xl"
          >
            <Tabs
              value={mode}
              onValueChange={(value) => setMode(value as RegistrationMode)}
              className="space-y-5"
            >
              <div className="flex items-center">
                <SegmentedTabs items={registrationTabs} />
              </div>

              <TabsContent value="direct" className="mt-0">
                <FormCreateUsuario
                  onSuccess={handleCreated}
                  onCancel={() => handleOpenChange(false)}
                />
              </TabsContent>

              <TabsContent value="invitation" className="mt-0">
                <FormInviteUsuario
                  onSuccess={handleInvitationSent}
                  onCancel={() => handleOpenChange(false)}
                />
              </TabsContent>
            </Tabs>
          </FormDialog>
        </Dialog>
      )}
    </PageHeader>
  )
}
