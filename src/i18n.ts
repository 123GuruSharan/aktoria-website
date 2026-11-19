export type Locale = 'en' | 'es';

export interface Translations {
  [key: string]: string;
}

export const translations: Record<Locale, Translations> = {
  en: {
    // Header & Global
    'header.status': 'TELEOPERATION READY // SF-HQ • IND-MEX',
    'nav.menu': 'CHAPTERS',
    'nav.close': 'CLOSE [ESC]',
    'chapters.c01': 'Interactive Hero',
    'chapters.c02': 'Hardware Inspection',
    'chapters.c03': 'The Distance Between',
    'chapters.c04': 'Operator Workspace',
    'chapters.c05': 'Teleoperation Task',
    'chapters.c06': 'Deployments',

    // Fullscreen Menu
    'menu.desc01': 'Virtual operator handle driving real-time simulated YAM robotic gripper.',
    'menu.desc02': 'Draggable split inspection slider between shaded arm and CAD outline.',
    'menu.desc03': 'Interactive route comparison: ~5 ms local India vs ~125 ms India to Mexico.',
    'menu.desc04': 'Explorable 3D workcell with 3 camera presets, orbit drag, and layer toggles.',
    'menu.desc05': 'Three-step teleoperation simulation: align, pinch, and transfer workpiece.',
    'menu.desc06': 'Deploy human-in-the-loop teleoperation fleets with verified contact.',

    // Scene 01: Hero
    'hero.badge': 'EXHIBITION 01 // TELEOPERATION SIGNATURE',
    'hero.tag': 'LIVE TELEMETRY',
    'hero.title': 'Move here. Act there.',
    'hero.line1': 'Move here.',
    'hero.line2': 'Act there.',
    'hero.subtext': 'Real-time cross-continental teleoperation. Trained operators in India guide I2RT YAM robotic arms in Mexico with low latency and AR/VR spatial simulation.',
    'hero.controlTitle': 'VIRTUAL OPERATOR CONTROLLER',
    'hero.dragInstruction': 'Drag to move the gripper',
    'hero.keyHint': 'Or use Arrow Keys',
    'hero.playExample': 'Play example',
    'hero.reset': 'Reset',
    'hero.traceActive': 'Trace preserved: Orange trajectory tracks your teleoperation',
    'hero.simLabel': 'Illustrative simulation • Modeled on I2RT YAM kinematics',
    'hero.scrollHint': 'Scroll to stretch trace →',

    // Scene 02: Hardware Inspection
    'inspect.badge': 'HARDWARE INSPECTION',
    'inspect.tag': 'I2RT YAM 6-DOF',
    'inspect.title': 'Meet the arm.',
    'inspect.subtext': 'The I2RT YAM 6-DOF architecture. Engineered for high-speed cross-border teleoperation with zero-backlash joint actuation.',
    'inspect.spotBase': 'Base',
    'inspect.spotElbow': 'Elbow',
    'inspect.spotArm': 'Elbow',
    'inspect.spotGripper': 'Gripper',
    'inspect.viewFull': 'View full arm',
    'inspect.divider': 'SCAN',
    'inspect.noteScan': 'Drag the divider to scan across physical finish and CAD wireframe.',
    'inspect.noteCredit': 'I2RT YAM Open-Architecture Robotics • Illustrative CAD model',

    // Hotspot Texts (English)
    'hotspot.base.title': 'Base Actuator',
    'hotspot.base.spec': 'HIGH-TORQUE BRUSHLESS ACTUATOR',
    'hotspot.base.desc': 'Continuous 360° rotation with dual absolute magnetic encoders for instant zero-latency calibration.',
    'hotspot.elbow.title': 'Articulated Elbow',
    'hotspot.elbow.spec': 'HIGH-TORQUE PITCH ACTUATOR',
    'hotspot.elbow.desc': 'Zero-backlash planetary transmission connecting upper arm and forearm.',
    'hotspot.arm.title': 'Articulated Elbow',
    'hotspot.arm.spec': 'HIGH-TORQUE PITCH ACTUATOR',
    'hotspot.arm.desc': 'Zero-backlash planetary transmission connecting upper arm and forearm.',
    'hotspot.gripper.title': 'Linear Gripper',
    'hotspot.gripper.spec': '95MM PARALLEL MECHANISM',
    'hotspot.gripper.desc': 'Wide 95mm throw with calibrated pinch force sensing and rubberized fingertip pads for compliant grasping.',

    // Scene 03: The Distance Between
    'routes.badge': 'EXHIBITION 03 // GLOBAL LATENCY ARCHITECTURE',
    'routes.tag': 'GLOBAL TRANSIT',
    'routes.title': 'One operator. Two routes.',
    'routes.subtext': 'Physical distance does not mean operational compromise. Aktoria’s proprietary network stack routes low-latency teleoperation packets directly between Indian operator hubs and client factories across Mexico.',
    'routes.tabIndia': 'Within India',
    'routes.tabMexico': 'India → Mexico',
    'routes.sendSignal': 'Send a sample signal',
    'routes.statLabel': 'COMPANY-REPORTED LATENCY',
    'routes.routeTypeLabel': 'OPERATIONAL ROUTE',
    'routes.routeTypeVal': 'Direct Teleoperation Link',
    'routes.routeTypeSub': 'Illustrative Playback • Operator to Remote Workcell',
    'routes.hqLabel': 'GLOBAL HEADQUARTERS',
    'routes.hqCity': 'San Francisco, California',
    'routes.hqSub': 'Company Base • Core Platform & Engineering',
    'routes.illustrative': 'ILLUSTRATIVE PLAYBACK • COMPANY-REPORTED LATENCY',
    'routes.signalTransmitting': 'ILLUSTRATIVE PLAYBACK // TRANSMITTING SIGNAL',
    'routes.signalDelivered': 'ILLUSTRATIVE PLAYBACK // SIGNAL DELIVERED',
    'routes.tiltHint': 'As you scroll, this coordinate grid tilts to form the floor plane of the remote workcell in Monterrey.',

    // Scene 04: Workspace
    'workcell.badge': 'EXHIBITION 04 // SPATIAL DIGITAL TWIN',
    'workcell.tag': 'AR/VR DIGITAL TWIN',
    'workcell.title': 'See what the operator sees.',
    'workcell.subtext': 'In AR and VR, remote operators in India do not merely watch video feeds: they operate within a real-time 3D reconstruction of the remote workspace, synchronized with sub-centimeter fiducial tracking.',
    'workcell.presetsLabel': 'CAMERA VIEW:',
    'workcell.camOperator': 'Operator',
    'workcell.camOverhead': 'Overhead',
    'workcell.camDetail': 'Gripper detail',
    'workcell.resetView': 'Reset View',
    'workcell.exploreView': 'Explore view',
    'workcell.exitExplore': 'Lock page scroll',
    'workcell.layersLabel': 'LAYERS:',
    'workcell.layerLabels': 'Equipment labels',
    'workcell.layerGrid': 'Floor grid',
    'workcell.layerPath': 'Motion path',
    'workcell.tagArm': 'I2RT YAM-06 Arm',
    'workcell.tagTable': 'Remote Workbench',
    'workcell.tagGripper': '95mm Linear Gripper',
    'workcell.tagPiece': 'Machined Workpiece',
    'workcell.dragOrbit': 'Drag anywhere to orbit • Pinch to zoom',
    'workcell.simTag': 'Illustrative workspace simulation',

    // Equipment Explanation Sheets (English)
    'sheet.arm.tag': 'EQUIPMENT // 01',
    'sheet.arm.title': 'I2RT YAM 6-DOF Manipulator',
    'sheet.arm.desc': 'Six brushless direct-drive actuators with low-inertia carbon-fiber links allow rapid, precise trajectory tracking under operator guidance.',
    'sheet.table.tag': 'EQUIPMENT // 02',
    'sheet.table.title': 'Teleoperation Workbench',
    'sheet.table.desc': 'Heavy-duty steel fixture with optomechanical fiducials that provide ground-truth coordinate anchors for the AR operator headset.',
    'sheet.gripper.tag': 'EQUIPMENT // 03',
    'sheet.gripper.title': 'Wide-Throw Linear Gripper',
    'sheet.gripper.desc': '95mm stroke end-effector equipped with tactile strain sensors to relay force feedback directly to the operator station.',
    'sheet.piece.tag': 'EQUIPMENT // 04',
    'sheet.piece.title': 'Machined Workpiece',
    'sheet.piece.desc': 'Anodized aluminum test cylinder used for pick-and-place precision certification and trajectory repeatability tests.',

    // Fallback
    'fallback.title': '3D Workcell Simulation',
    'fallback.desc': 'Hardware accelerated WebGL is not available on this device. Showing illustrative step-through render.',

    // Scene 05: Task
    'task.badge': 'EXHIBITION 05 // REAL-TIME CONTROL DEMO',
    'task.tag': 'REMOTE WORKCELL',
    'task.title': 'Pick. Move. Place.',
    'task.subtext': 'Experience cross-continental teleoperation firsthand. Align the gripper, pinch the workpiece, and transfer it cleanly to the designated inspection zone.',
    'task.playDemo': 'Play demo',
    'task.tryMyself': 'Try it yourself',
    'task.pause': 'Pause',
    'task.resume': 'Resume',
    'task.reset': 'Reset Task',
    'task.placementComplete': 'Placement complete',
    'task.misplaced': 'Workpiece released outside target. Supported position restored for retry.',
    'task.btnLower': 'Lower',
    'task.btnRaise': 'Raise',
    'task.btnGrip': 'Grip / Release',
    'task.keyboardGuide': 'Keyboard: Arrow keys to move • [Down]/[Up] to lower/raise • [Space] to grip',
    'task.step1Title': 'Align Gripper',
    'task.step1Desc': 'Center the gripper fingers directly over the machined workpiece.',
    'task.step2Title': 'Close & Pinch',
    'task.step2Desc': 'Activate parallel linear clamp with calibrated 15 N force.',
    'task.step3Title': 'Move & Place',
    'task.step3Desc': 'Transfer the piece to the destination zone and release.',
    'task.manualHint1': 'Drag table cursor, use buttons below, or Arrow Keys to position gripper.',
    'task.manualHint2': 'Workpiece detected in alignment envelope! Tap "Lower" then "Grip".',
    'task.manualHint3': 'Workpiece securely clamped! Tap "Raise" then move to target.',
    'task.manualHint4': 'Aligned over destination zone! Tap "Lower" then "Release".',
    'task.btnAlign': 'Align over Piece',
    'task.btnPinch': 'Clamp Gripper (Pinch)',
    'task.btnMove': 'Transfer to Target',
    'task.btnRelease': 'Release Workpiece',
    'task.completeTitle': 'Teleoperation Task Completed Successfully',
    'task.completeNote': 'Notice the recorded orange trajectory path. As you scroll, this motion curve transitions directly into the contact headline underline.',
    'task.replay': 'Replay',

    // Scene 06: Contact & Deployments
    'contact.badge': 'EXHIBITION 06 // DEPLOYMENT',
    'contact.tag': 'DEPLOYMENT // SF HQ',
    'contact.title': 'Bring your workspace within reach.',
    'contact.subtext': 'Tell us about your teleoperation project.',
    'contact.btnDiscuss': 'Discuss a deployment',
    'contact.btnVerified': 'Verified Portal: aktoria.com',
    'modal.title': 'Initiate Teleoperation Fleet',
    'modal.fieldName': 'Name',
    'modal.fieldEmail': 'Work Email',
    'modal.fieldCompany': 'Company',
    'modal.fieldDetails': 'Project Details',
    'modal.fieldDetailsPlaceholder': 'Describe payload, degrees of freedom, site constraints, or fleet goals...',
    'modal.fieldRoute': 'Primary Teleoperation Route',
    'modal.fieldFleet': 'Target Fleet Scope',
    'modal.btnSubmit': 'Discuss a deployment',
    'modal.submitting': 'Transmitting deployment inquiry...',
    'modal.successTitle': 'Deployment Request Received',
    'modal.successMsg': 'Our San Francisco systems engineering team will review your project parameters and schedule an operational architecture briefing within 24 hours.',
    'footer.langLabel': 'LANGUAGE:'
  },
  es: {
    // Header & Global
    'header.status': 'TELEOPERACIÓN ACTIVA // SF-HQ • IND-MEX',
    'nav.menu': 'CAPÍTULOS',
    'nav.close': 'CERRAR [ESC]',
    'chapters.c01': 'Héroe Interactivo',
    'chapters.c02': 'Inspección de Hardware',
    'chapters.c03': 'La Distancia Entre Ambos',
    'chapters.c04': 'Espacio del Operador',
    'chapters.c05': 'Tarea de Teleoperación',
    'chapters.c06': 'Despliegues',

    // Fullscreen Menu
    'menu.desc01': 'Palanca virtual de operador controlando en tiempo real la pinza robótica YAM.',
    'menu.desc02': 'Control deslizante de inspección entre el brazo sombreado y el plano CAD.',
    'menu.desc03': 'Comparativa de rutas: ~5 ms local en India vs ~125 ms de India a México.',
    'menu.desc04': 'Célula de trabajo 3D explorable con 3 cámaras, órbita táctil y capas activas.',
    'menu.desc05': 'Simulación de 3 pasos: alineación, sujeción y transferencia de pieza.',
    'menu.desc06': 'Despliegue de flotas de teleoperación con soporte y contacto verificado.',

    // Scene 01: Hero
    'hero.badge': 'EXPOSICIÓN 01 // INTERACCIÓN DISTINTIVA',
    'hero.tag': 'TELEMETRÍA EN VIVO',
    'hero.title': 'Mueve aquí. Actúa allá.',
    'hero.line1': 'Mueve aquí.',
    'hero.line2': 'Actúa allá.',
    'hero.subtext': 'Teleoperación intercontinental en tiempo real. Operadores capacitados en India guían brazos robóticos I2RT YAM en México con baja latencia y simulación espacial AR/VR.',
    'hero.controlTitle': 'CONTROLADOR VIRTUAL DEL OPERADOR',
    'hero.dragInstruction': 'Arrastra para mover la pinza',
    'hero.keyHint': 'O utiliza las flechas del teclado',
    'hero.playExample': 'Ver ejemplo',
    'hero.reset': 'Restablecer',
    'hero.traceActive': 'Trazo preservado: La trayectoria naranja sigue tu teleoperación',
    'hero.simLabel': 'Simulación ilustrativa • Modelada sobre cinemática I2RT YAM',
    'hero.scrollHint': 'Desplázate para extender el trazo →',

    // Scene 02: Hardware Inspection
    'inspect.badge': 'INSPECCIÓN DE HARDWARE',
    'inspect.tag': 'I2RT YAM 6-DOF',
    'inspect.title': 'Conoce el brazo.',
    'inspect.subtext': 'Arquitectura I2RT YAM de 6 grados de libertad. Diseñada para teleoperación transfronteriza veloz con cero holgura mecánica.',
    'inspect.spotBase': 'Base',
    'inspect.spotElbow': 'Codo',
    'inspect.spotArm': 'Codo',
    'inspect.spotGripper': 'Pinza',
    'inspect.viewFull': 'Ver brazo completo',
    'inspect.divider': 'ESCANEAR',
    'inspect.noteScan': 'Mueve la barra para escanear entre el acabado real y el plano alámbrico CAD.',
    'inspect.noteCredit': 'Robótica de arquitectura abierta I2RT YAM • Modelo CAD ilustrativo',

    // Hotspot Texts (Spanish)
    'hotspot.base.title': 'Actuador de Base',
    'hotspot.base.spec': 'ACTUADOR BRUSHLESS DE ALTO TORQUE',
    'hotspot.base.desc': 'Rotación continua de 360° con codificadores magnéticos absolutos duales.',
    'hotspot.elbow.title': 'Codo Articulado',
    'hotspot.elbow.spec': 'ACTUADOR DE INCLINACIÓN DE ALTO TORQUE',
    'hotspot.elbow.desc': 'Transmisión planetaria sin holgura que conecta el brazo superior y el antebrazo.',
    'hotspot.arm.title': 'Codo Articulado',
    'hotspot.arm.spec': 'ACTUADOR DE INCLINACIÓN DE ALTO TORQUE',
    'hotspot.arm.desc': 'Transmisión planetaria sin holgura que conecta el brazo superior y el antebrazo.',
    'hotspot.gripper.title': 'Pinza Lineal',
    'hotspot.gripper.spec': 'MECANISMO PARALELO DE 95 MM',
    'hotspot.gripper.desc': 'Apertura amplia de 95 mm con sensores de fuerza calibrada y almohadillas elastoméricas para agarres seguros.',

    // Scene 03: The Distance Between
    'routes.badge': 'EXPOSICIÓN 03 // ARQUITECTURA GLOBAL DE LATENCIA',
    'routes.tag': 'TRÁNSITO GLOBAL',
    'routes.title': 'Un operador. Dos rutas.',
    'routes.subtext': 'La distancia física no implica compromiso operativo. El protocolo de red patentado de Aktoria transmite paquetes de teleoperación directamente entre centros en India y fábricas en México.',
    'routes.tabIndia': 'Dentro de India',
    'routes.tabMexico': 'India → México',
    'routes.sendSignal': 'Enviar señal de prueba',
    'routes.statLabel': 'LATENCIA REPORTADA POR LA EMPRESA',
    'routes.routeTypeLabel': 'CANAL OPERATIVO',
    'routes.routeTypeVal': 'Enlace Directo de Teleoperación',
    'routes.routeTypeSub': 'Reproducción Ilustrativa • Operador a Célula Remota',
    'routes.hqLabel': 'SEDE GLOBAL',
    'routes.hqCity': 'San Francisco, California',
    'routes.hqSub': 'Base de la Empresa • Plataforma e Ingeniería',
    'routes.illustrative': 'REPRODUCCIÓN ILUSTRATIVA • LATENCIA REPORTADA POR LA EMPRESA',
    'routes.signalTransmitting': 'REPRODUCCIÓN ILUSTRATIVA // TRANSMITIENDO SEÑAL',
    'routes.signalDelivered': 'REPRODUCCIÓN ILUSTRATIVA // SEÑAL ENTREGADA',
    'routes.tiltHint': 'Al desplazarte, esta cuadrícula de coordenadas se inclina para convertirse en la mesa de trabajo en Monterrey.',

    // Scene 04: Workspace
    'workcell.badge': 'EXPOSICIÓN 04 // GEMELO DIGITAL ESPACIAL',
    'workcell.tag': 'GEMELO DIGITAL AR/VR',
    'workcell.title': 'Observa lo que ve el operador.',
    'workcell.subtext': 'En realidad virtual y aumentada, los operadores en India no solo observan pantallas de video: operan dentro de una reconstrucción 3D en tiempo real del área de trabajo con seguimiento fiducial subcentimétrico.',
    'workcell.presetsLabel': 'VISTA DE CÁMARA:',
    'workcell.camOperator': 'Operador',
    'workcell.camOverhead': 'Cenital',
    'workcell.camDetail': 'Detalle de pinza',
    'workcell.resetView': 'Restablecer vista',
    'workcell.exploreView': 'Explorar vista',
    'workcell.exitExplore': 'Fijar desplazamiento',
    'workcell.layersLabel': 'CAPAS:',
    'workcell.layerLabels': 'Etiquetas de equipo',
    'workcell.layerGrid': 'Malla de suelo',
    'workcell.layerPath': 'Trayectoria',
    'workcell.tagArm': 'Brazo I2RT YAM-06',
    'workcell.tagTable': 'Mesa Remota',
    'workcell.tagGripper': 'Pinza Lineal 95mm',
    'workcell.tagPiece': 'Pieza Maquinada',
    'workcell.dragOrbit': 'Arrastra para orbitar • Pellizca para zoom',
    'workcell.simTag': 'Simulación ilustrativa del espacio de trabajo',

    // Equipment Explanation Sheets (Spanish)
    'sheet.arm.tag': 'EQUIPO // 01',
    'sheet.arm.title': 'Manipulador 6-DOF I2RT YAM',
    'sheet.arm.desc': 'Seis actuadores brushless de accionamiento directo con eslabones de baja inercia permiten un seguimiento rápido y preciso.',
    'sheet.table.tag': 'EQUIPO // 02',
    'sheet.table.title': 'Mesa de Teleoperación',
    'sheet.table.desc': 'Estructura de acero reforzado con marcadores optomecánicos que proporcionan anclajes espaciales para el visor de realidad virtual.',
    'sheet.gripper.tag': 'EQUIPO // 03',
    'sheet.gripper.title': 'Pinza Lineal de Amplio Rango',
    'sheet.gripper.desc': 'Mecanismo de 95 mm con transductores de deformación para transmitir retroalimentación háptica a la estación del operador.',
    'sheet.piece.tag': 'EQUIPO // 04',
    'sheet.piece.title': 'Pieza Maquinada',
    'sheet.piece.desc': 'Cilindro de prueba de aluminio anodizado utilizado para verificar la repetibilidad milimétrica de las trayectorias.',

    // Fallback
    'fallback.title': 'Simulación 3D de Célula de Trabajo',
    'fallback.desc': 'Aceleración WebGL no disponible en este dispositivo. Mostrando renderizado ilustrativo por etapas.',

    // Scene 05: Task
    'task.badge': 'EXPOSICIÓN 05 // DEMO DE CONTROL EN VIVO',
    'task.tag': 'CÉLULA REMOTA',
    'task.title': 'Tomar. Mover. Colocar.',
    'task.subtext': 'Prueba la teleoperación transcontinental de primera mano. Alinea la pinza, sujeta la pieza de trabajo y trasládala limpiamente a la zona de inspección.',
    'task.playDemo': 'Ver demostración',
    'task.tryMyself': 'Probar yo mismo',
    'task.pause': 'Pausar',
    'task.resume': 'Reanudar',
    'task.reset': 'Reiniciar tarea',
    'task.placementComplete': 'Colocación completada',
    'task.misplaced': 'Pieza soltada fuera del objetivo. Posición restablecida para reintentar.',
    'task.btnLower': 'Bajar',
    'task.btnRaise': 'Subir',
    'task.btnGrip': 'Sujetar / Soltar',
    'task.keyboardGuide': 'Teclado: Flechas para mover • [Abajo]/[Arriba] para bajar/subir • [Espacio] para sujetar',
    'task.step1Title': 'Alinear Pinza',
    'task.step1Desc': 'Centra las mordazas de la pinza directamente sobre la pieza maquinada.',
    'task.step2Title': 'Cerrar y Sujetar',
    'task.step2Desc': 'Activa la pinza lineal paralela con una fuerza calibrada de 15 N.',
    'task.step3Title': 'Mover y Soltar',
    'task.step3Desc': 'Traslada la pieza hacia la zona objetivo y libera el agarre.',
    'task.manualHint1': 'Arrastra el cursor de la mesa, usa los botones inferiores o las flechas para posicionar la pinza.',
    'task.manualHint2': '¡Pieza detectada en rango! Toca "Bajar" y luego "Sujetar".',
    'task.manualHint3': '¡Pieza firmemente sujeta! Toca "Subir" y traslada al objetivo.',
    'task.manualHint4': '¡En la zona objetivo! Toca "Bajar" y luego "Soltar".',
    'task.btnAlign': 'Alinear sobre Pieza',
    'task.btnPinch': 'Cerrar Pinza (Sujetar)',
    'task.btnMove': 'Trasladar a Objetivo',
    'task.btnRelease': 'Soltar Pieza',
    'task.completeTitle': 'Tarea de Teleoperación Completada Exitosamente',
    'task.completeNote': 'Observa el trazo naranja registrado. Al desplazarte, esta curva se convierte en el subrayado del titular de contacto.',
    'task.replay': 'Repetir',

    // Scene 06: Contact & Deployments
    'contact.badge': 'EXPOSICIÓN 06 // DESPLIEGUE',
    'contact.tag': 'DESPLIEGUE // SEDE SF',
    'contact.title': 'Pon tu espacio de trabajo al alcance de tu mano.',
    'contact.subtext': 'Cuéntanos sobre tu proyecto de teleoperación.',
    'contact.btnDiscuss': 'Consultar un despliegue',
    'contact.btnVerified': 'Portal Verificado: aktoria.com',
    'modal.title': 'Iniciar Flota de Teleoperación',
    'modal.fieldName': 'Nombre',
    'modal.fieldEmail': 'Correo Corporativo',
    'modal.fieldCompany': 'Empresa',
    'modal.fieldDetails': 'Detalles del Proyecto',
    'modal.fieldDetailsPlaceholder': 'Describe carga útil, grados de libertad, limitaciones del sitio u objetivos...',
    'modal.fieldRoute': 'Ruta de Teleoperación Principal',
    'modal.fieldFleet': 'Alcance de la Flota',
    'modal.btnSubmit': 'Consultar un despliegue',
    'modal.submitting': 'Transmitiendo solicitud de despliegue...',
    'modal.successTitle': 'Solicitud de Despliegue Recibida',
    'modal.successMsg': 'Nuestro equipo de ingeniería de sistemas en San Francisco revisará los parámetros de red y coordinará una sesión informativa en menos de 24 horas.',
    'footer.langLabel': 'IDIOMA:'
  }
};

class I18nManager {
  private currentLocale: Locale = 'en';
  private listeners: Array<(locale: Locale) => void> = [];

  constructor() {
    // Check localStorage or browser language preference if in browser
    if (typeof window !== 'undefined') {
      try {
        const saved = typeof localStorage !== 'undefined'
          ? ((localStorage.getItem('aktoria_lang') || localStorage.getItem('ectoria_lang')) as Locale | null)
          : null;
        if (saved && (saved === 'en' || saved === 'es')) {
          this.currentLocale = saved;
        } else if (typeof navigator !== 'undefined') {
          const browserLang = navigator.language.slice(0, 2);
          if (browserLang === 'es') {
            this.currentLocale = 'es';
          }
        }
      } catch {
        // Fallback to default
      }
    }
  }

  public getLocale(): Locale {
    return this.currentLocale;
  }

  public setLocale(locale: Locale) {
    if (locale !== this.currentLocale) {
      this.currentLocale = locale;
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem('aktoria_lang', locale);
        } catch {
          // ignore
        }
      }
      if (typeof document !== 'undefined') {
        document.documentElement.lang = locale;
      }
      this.applyTranslations();
      this.listeners.forEach((fn) => fn(locale));
    }
  }

  public t(key: string): string {
    const dict = translations[this.currentLocale];
    return dict[key] || translations['en'][key] || key;
  }

  public onLocaleChange(fn: (locale: Locale) => void) {
    this.listeners.push(fn);
  }

  public applyTranslations() {
    if (typeof document === 'undefined') return;
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        const text = this.t(key);
        // If element is an input with placeholder, or standard text
        if (el instanceof HTMLInputElement && el.placeholder) {
          el.placeholder = text;
        } else {
          el.textContent = text;
        }
      }
    });

    // Update active state of lang buttons in header and footer
    document.querySelectorAll('.lang-btn, .footer-lang-btn').forEach((btn) => {
      const lang = btn.getAttribute('data-lang');
      const isActive = lang === this.currentLocale;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  }
}

export const i18n = new I18nManager();
