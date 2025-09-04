<?php

namespace Database\Seeders;

use App\Models\Machine;
use App\Models\Subsystem;
use App\Models\InspectionPoint;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class HuberMachineSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Asegurarnos de que exista un usuario para asociarlo como creador
        $user = User::firstOrCreate(['email' => 'admin@tpm.com'], [
            'name' => 'Admin User',
            'password' => bcrypt('password'),
        ]);

        // Crear la máquina Huber
        $huber = Machine::updateOrCreate(
            ['name' => 'Huber Machine'],
            [
                'description' => 'Máquina de moldeo por inyección para piezas de resina.',
                'created_by' => $user->id,
            ]
        );

        // Definir los subsistemas y sus puntos de inspección
        $subsystems = [
            'Sistema Hidráulico y de Lubricación' => [
                ['name' => 'Revisar nivel de aceite/fugas', 'description' => 'Verificar visualmente que el nivel de aceite hidráulico esté dentro de los marcadores de mínimo y máximo. Buscar activamente cualquier goteo o mancha de aceite en mangueras, conexiones y sellos del sistema.'],
                ['name' => 'Revisar tornillería de servos, que no estén flojos', 'description' => 'Inspeccionar visualmente y con la mano los tornillos de montaje de los servomotores para asegurar que estén firmemente apretados y no haya vibraciones anormales.'],
                ['name' => 'Revisar lubricación de vástagos de servos ollas A y B', 'description' => 'Confirmar que los vástagos (pistones) de los servos para las ollas A y B tengan una capa adecuada y uniforme de lubricante, y no presenten signos de resequedad o contaminación.'],
                ['name' => 'Aplicar grasa (una bombeada) en graseras, limpiar exceso', 'description' => 'Localizar todas las graseras designadas, aplicar una sola bombeada de grasa con la pistola y limpiar cuidadosamente el exceso para evitar la acumulación de polvo y suciedad.'],
            ],
            'Sistema de Resina' => [
                ['name' => 'Revisar que las tuberías no tengan fugas de resina (conexiones)', 'description' => 'Seguir el recorrido completo de las tuberías de resina, prestando especial atención a las uniones, codos y conexiones en busca de cualquier signo de escurrimiento o goteo.'],
                ['name' => 'Revisar el escurrimiento de resina de tanque A y B (Área de muestras)', 'description' => 'Inspeccionar detalladamente el área de toma de muestras de los tanques A y B para detectar cualquier derrame o goteo de resina que pueda indicar un problema en las válvulas.'],
                ['name' => 'Revisar contenedores de resina (nivel/fugas)', 'description' => 'Verificar el nivel de material en los contenedores principales y realizar una inspección visual alrededor de su base y conexiones en busca de posibles fugas.'],
                ['name' => 'Revisar mecanismos de inyección de resina sin escurrimientos', 'description' => 'Observar el cabezal y los mecanismos de inyección durante y después de un ciclo para asegurar que no haya goteos de resina que puedan afectar la calidad del producto o la limpieza.'],
                ['name' => 'Revisar mecanismo de inyección de resina', 'description' => 'Inspeccionar el estado general del mecanismo de inyección en busca de desgaste visible, daños o acumulación excesiva de resina curada que pueda impedir su correcto movimiento.'],
                ['name' => 'Grúa de carga de resina funcione correctamente', 'description' => 'Operar la grúa de carga de resina en un ciclo completo (subir y bajar) para verificar que se mueva suavemente, sin ruidos anormales y que los seguros funcionen correctamente.'],
            ],
            'Sistema Neumático y de Enfriamiento' => [
                ['name' => 'Revisar la limpieza de abanicos de enfriamiento', 'description' => 'Asegurarse de que las aspas y las rejillas de los ventiladores de enfriamiento estén libres de polvo y suciedad para garantizar un flujo de aire adecuado y prevenir sobrecalentamientos.'],
                ['name' => 'Revisar filtros de aire de entrada', 'description' => 'Extraer y examinar los filtros de aire de entrada. Limpiarlos con aire a presión o reemplazarlos si se encuentran sucios u obstruidos.'],
                ['name' => 'Revisar fugas de aire', 'description' => 'Con la máquina presurizada, escuchar atentamente en busca de siseos y revisar las líneas de aire y conexiones (especialmente las uniones rápidas) en busca de fugas.'],
            ],
            'Componentes Estructurales y de Cámara' => [
                ['name' => 'Revisar puerta de cámara con guías lubricadas', 'description' => 'Verificar que las guías sobre las que se desliza la puerta de la cámara estén limpias y tengan una capa fina de lubricante para asegurar un movimiento suave y sin atascos.'],
                ['name' => 'Revisar empaque de puerta en buen estado', 'description' => 'Inspeccionar visualmente todo el perímetro del empaque de la puerta en busca de grietas, roturas, aplastamiento o deformaciones que puedan comprometer el sellado de la cámara.'],
                ['name' => 'Revisar limpieza dentro de la cámara', 'description' => 'Realizar una inspección visual del interior de la cámara para asegurar que esté libre de residuos de resina, polvo y otros contaminantes que puedan afectar el producto.'],
            ],
            'Sistema Eléctrico y de Control' => [
                ['name' => 'Revisar que los manómetros estén en buen estado', 'description' => 'Comprobar que los manómetros (medidores de presión) muestren lecturas estables dentro del rango de operación y que no estén dañados, con el cristal roto o con la aguja atascada.'],
                ['name' => 'Revisar el ruteo de cables y mangueras', 'description' => 'Asegurarse de que todos los cables eléctricos y mangueras neumáticas estén ordenados, sujetos correctamente, sin torceduras y que no rocen contra partes móviles o filosas.'],
                ['name' => 'Revisar luces indicadoras', 'description' => 'Verificar que todas las luces indicadoras del panel de control (encendido, alarma, en ciclo, etc.) se enciendan y apaguen correctamente según el estado de la máquina.'],
                ['name' => 'Revisar funcionamiento de lámparas', 'description' => 'Encender las lámparas internas de la cámara para confirmar que todas iluminen correctamente y no parpadeen.'],
                ['name' => 'Revisar botones del control eléctrico/sensores en buen estado', 'description' => 'Inspeccionar los botones, interruptores y sensores del panel de control en busca de daños físicos (grietas, desgaste) y confirmar su correcto funcionamiento al presionarlos.'],
                ['name' => 'Revisar exceso de ruido', 'description' => 'Durante el funcionamiento de la máquina, escuchar atentamente para detectar cualquier ruido inusual como rechinidos, golpeteos metálicos o zumbidos eléctricos fuertes que puedan indicar un problema mecánico o eléctrico.'],
            ],
        ];

        foreach ($subsystems as $subsystemName => $points) {
            $subsystem = $huber->subsystems()->updateOrCreate(['name' => $subsystemName]);

            foreach ($points as $pointData) {
                $subsystem->inspectionPoints()->updateOrCreate(
                    ['name' => $pointData['name']],
                    ['description' => $pointData['description']]
                );
            }
        }
    }
}
