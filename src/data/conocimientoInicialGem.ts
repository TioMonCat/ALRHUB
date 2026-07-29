// src/data/conocimientoInicialGem.ts

export const CONOCIMIENTO_INICIAL_GEM = {
  equipo: {
    nombre: "ALR",
    rol_asistente: "Ingeniero ALR (Ingeniero Jefe de Pista)",
    simuladores_compatibles: [
      "Assetto Corsa (AC)",
      "Assetto Corsa Competizione (ACC)"
    ]
  },
  flota_vehiculos: [
    {
      modelo: "Mercedes-AMG GT3 / GT3 EVO",
      categoria: "GT3",
      disposicion_motor: "Delantero / Tracción Trasera (FR)",
      distribucion_peso: "Front-Mid engine",
      caracteristicas_dinamicas: {
        comportamiento_base: "Neutro a subvirador en entrada por peso en tren delantero; gran tracción en salida.",
        gestion_neumaticos: "Exige más los neumáticos delanteros en frenadas intensas y curvas rápidas.",
        sensibilidad_setup: "Sensible a presiones delanteras, altura delantera y rigidez de barras estabilizadoras delanteras."
      },
      circuitos_registrados: []
    },
    {
      modelo: "Oreca 07 LMP2",
      categoria: "LMP2",
      disposicion_motor: "Central Trasero / Tracción Trasera (MR)",
      distribucion_peso: "Alta carga aerodinámica, centro de gravedad muy bajo",
      caracteristicas_dinamicas: {
        comportamiento_base: "Extremadamente sensible a la altura respecto al suelo (ride height) y al rake aerodinámico.",
        gestion_neumaticos: "Requiere ventana óptima de temperatura rápida; muy dependiente del agarre aerodinámico en media/alta velocidad.",
        sensibilidad_setup: "Pequeños cambios en dampers (amortiguadores) y empaquetadores (packers) alteran dramáticamente la estabilidad."
      },
      circuitos_registrados: []
    },
    {
      modelo: "Porsche 911 GT3 R",
      categoria: "GT3",
      disposicion_motor: "Trasero / Tracción Trasera (RR)",
      distribucion_peso: "Mayor porcentaje de peso sobre el eje trasero",
      caracteristicas_dinamicas: {
        comportamiento_base: "Excelente tracción de salida; propenso a sobreviraje por transferencia de masa o subviraje en entrada si no se trail-brakea adecuadamente.",
        gestion_neumaticos: "Exige más el neumático trasero bajo aceleración, conserva bien los delanteros.",
        sensibilidad_setup: "Sensible a la precarga del diferencial, altura trasera y repartidor de frenada."
      },
      circuitos_registrados: []
    }
  ],
  principios_de_setup: {
    presiones_neumaticos: {
      ACC_GT3_seco_target_psi: "26.8 - 27.3 PSI (Hot)",
      ACC_GT3_mojado_target_psi: "29.5 - 31.0 PSI (Hot)",
      AC_general: "Ajustar para mantener ventana de temperatura óptima y parche de contacto uniforme."
    },
    geometria_y_alineacion: {
      caida_camber: "Maximizar agarre lateral en curva sin comprometer frenada en recta ni sobrecalentar la cara interna.",
      convergencia_toe: "Toe-out delantero para respuesta de dirección; Toe-in trasero para estabilidad en aceleración."
    },
    suspension_y_aerodinamica: {
      barras_estabilizadoras_arb: "Mayor rigidez en un eje reduce el agarre mecánico de ese eje.",
      rake_aerodinamico: "Aumentar altura trasera respecto a delantera desplaza balance hacia entrada/centro con más sobreviraje."
    }
  },
  reglas_diagnostico_ingeniero: [
    "1. Nunca entregar setup desde cero sin pedir telemetría, .ini o feedback de pista.",
    "2. Clasificar el problema según fase de curva: Entrada (Frenada/Trail Braking), Mid-Corner (Vértice), Salida (Aceleración).",
    "3. Aplicar cambios incrementales (1-3 clics) y solicitar tanda de comprobación de 4-5 vueltas.",
    "4. Incluir siempre al final el apartado 'Resumen de Ajustes' con formato de viñetas (Parámetro | Valor Anterior | Valor Nuevo)."
  ]
};
