<?php

namespace Database\Seeders;

use App\Models\Machine;
use App\Models\User;
use Illuminate\Database\Seeder;

class HVManualWindingSeeder extends Seeder
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

        // Crear la máquina HV-Manual Winding
        $hvWinding = Machine::updateOrCreate(
            ['name' => 'HV-Manual Winding II'],
            [
                'description' => 'Automated equipment for the precise winding of conductors to form high-voltage (HV) coils for power transformers.',
                'created_by' => $user->id,
            ]
        );

        // Definir los subsistemas y sus puntos de inspección
        // ACTION: Se eliminan las descripciones para que coincida 100% con la imagen.
        $subsystems = [
            'Sistema Mecánico y Estructural' => [
                ['name' => 'Verifica que la tornilleria este en buen estado y ajustada'],
                ['name' => 'Revisar y limpiar las guias del porta rollo y que funcionen correctamente'],
                ['name' => 'Aplicar grasa en la cremalleras y chumaceras segun requiera'],
                ['name' => 'Verificar que el porta rollo tenga movimiento para enfrente y para atras sin atoramientos'],
                ['name' => 'Verificar que no presente fugas de aceite en reductores de velocidad'],
                ['name' => 'Revisar que no tenga ningun ruido extraño (Revisar cuidadosamente)'],
                ['name' => 'Verificar el tornillo de sujetacion ( De un extremo de atras )'],
                ['name' => 'Revisar las prensas de sujecion que no esten desagustadas y funcionen correctamente'],
            ],
            'Sistema de Control y Operación' => [
                ['name' => 'Verifica los switches esten en funcionamiento y en buen estado'],
                ['name' => 'Verificar los botones de operaccion funcionen correctamente'],
            ],
        ];

        foreach ($subsystems as $subsystemName => $points) {
            $subsystem = $hvWinding->subsystems()->updateOrCreate(['name' => $subsystemName]);

            foreach ($points as $pointData) {
                // ACTION: Ahora solo se pasa el nombre. La descripción será null por defecto.
                $subsystem->inspectionPoints()->updateOrCreate(
                    ['name' => $pointData['name']]
                );
            }
        }
    }
}
