"use client";

import { useState } from "react";

interface FormCreateClienteProps {
  onSuccess: () => void;
}

export function FormCreateCliente({
  onSuccess,
}: FormCreateClienteProps) {
  const [tipoCliente, setTipoCliente] = useState("natural");

  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [rut, setRut] = useState("");
  const [telefono, setTelefono] = useState("");

  const [razon, setRazon] = useState("");
  const [nombreContacto, setNombreContacto] = useState("");
  const [giro, setGiro] = useState("");

  const [errores, setErrores] = useState({
    nombre: "",
    apellido: "",
    rut: "",
    telefono: "",
    razon: "",
  });

  const [cargando, setCargando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState("");

  const guardarCliente = async () => {
    const nuevosErrores = {
      nombre:
        tipoCliente === "natural" && !nombre
          ? "Campo obligatorio"
          : "",

      apellido:
        tipoCliente === "natural" && !apellido
          ? "Campo obligatorio"
          : "",

      rut: rut ? "" : "Campo obligatorio",

      telefono:
        telefono ? "" : "Campo obligatorio",

      razon:
        tipoCliente === "juridica" && !razon
          ? "Campo obligatorio"
          : "",
    };

    setErrores(nuevosErrores);

    if (
      nuevosErrores.nombre ||
      nuevosErrores.apellido ||
      nuevosErrores.rut ||
      nuevosErrores.telefono ||
      nuevosErrores.razon
    ) {
      return;
    }

    setCargando(true);
    setErrorGeneral("");

    try {
      const response = await fetch("/api/clientes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tipoCliente,
          nombre,
          apellido,
          razon,
          rut,
          telefono,
          nombreContacto,
          giro,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Error al guardar el cliente");
      }

      onSuccess();
    } catch (err: any) {
      console.error(err);
      setErrorGeneral(err.message || "Ocurrió un error inesperado.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block mb-1 font-medium">
          Tipo de Cliente:
        </label>

        <select
          className="w-full rounded-md p-2 border border-gray-300"
          value={tipoCliente}
          onChange={(e) => setTipoCliente(e.target.value)}
        >
          <option value="natural">
            Persona Natural
          </option>

          <option value="juridica">
            Persona Jurídica
          </option>
        </select>
      </div>

      {tipoCliente === "natural" && (
        <>
          <div>
            <label className="block mb-1 font-medium">
              Nombres:
            </label>

            <input
              className={`w-full rounded-md p-2 border ${
                errores.nombre
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
              value={nombre}
              onChange={(e) =>
                setNombre(e.target.value)
              }
              placeholder="Nombre"
            />

            {errores.nombre && (
              <p className="text-red-500 text-sm mt-1">
                {errores.nombre}
              </p>
            )}
          </div>

          <div>
            <label className="block mb-1 font-medium">
              Apellidos:
            </label>

            <input
              className={`w-full rounded-md p-2 border ${
                errores.apellido
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
              value={apellido}
              onChange={(e) =>
                setApellido(e.target.value)
              }
              placeholder="Apellidos"
            />

            {errores.apellido && (
              <p className="text-red-500 text-sm mt-1">
                {errores.apellido}
              </p>
            )}
          </div>
        </>
      )}

      {tipoCliente === "juridica" && (
        <>
          <div>
            <label className="block mb-1 font-medium">
              Razón Social:
            </label>

            <input
              className={`w-full rounded-md p-2 border ${
                errores.razon
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
              value={razon}
              onChange={(e) =>
                setRazon(e.target.value)
              }
              placeholder="Razón Social"
            />

            {errores.razon && (
              <p className="text-red-500 text-sm mt-1">
                {errores.razon}
              </p>
            )}
          </div>
        </>
      )}

      <div>
        <label className="block mb-1 font-medium">
          RUT:
        </label>

        <input
          className={`w-full rounded-md p-2 border ${
            errores.rut
              ? "border-red-500"
              : "border-gray-300"
          }`}
          value={rut}
          onChange={(e) => setRut(e.target.value)}
          placeholder="12345678-9"
        />

        {errores.rut && (
          <p className="text-red-500 text-sm mt-1">
            {errores.rut}
          </p>
        )}
      </div>

      <div>
        <label className="block mb-1 font-medium">
          Teléfono:
        </label>

        <input
          className={`w-full rounded-md p-2 border ${
            errores.telefono ? "border-red-500" : "border-gray-300"
          }`}
          value={telefono}
          onChange={(e) =>
            setTelefono(
              e.target.value.replace(/\D/g, "").slice(0, 9)
            )
          }
          placeholder="912345678"
          maxLength={9}
        />

        {errores.telefono && (
          <p className="text-red-500 text-sm mt-1">
            {errores.telefono}
          </p>
        )}
      </div>

      {tipoCliente === "juridica" && (
        <>
          <div>
            <label className="block mb-1 font-medium">
              Nombre de Contacto (Opcional):
            </label>

            <input
              className="w-full rounded-md p-2 border border-gray-300"
              value={nombreContacto}
              onChange={(e) =>
                setNombreContacto(e.target.value)
              }
              placeholder="Nombre de contacto"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">
              Giro (Opcional):
            </label>

            <input
              className="w-full rounded-md p-2 border border-gray-300"
              value={giro}
              onChange={(e) => setGiro(e.target.value)}
              placeholder="Giro de la empresa"
            />
          </div>
        </>
      )}

      {errorGeneral && (
        <p className="text-red-500 text-sm mt-1 bg-red-50 p-2 rounded border border-red-200">
          {errorGeneral}
        </p>
      )}

      <button
        onClick={guardarCliente}
        disabled={cargando}
        className="w-full bg-black text-white p-2 rounded-md hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {cargando ? "Guardando..." : "Guardar Cliente"}
      </button>
    </div>
  );
}