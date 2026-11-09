<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use App\Http\Middleware\EnsureUserIsAdmin;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->statefulApi();
        $middleware->alias(['admin' => EnsureUserIsAdmin::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Toda resposta de erro da API segue o mesmo formato JSON:
        //   { "message": "..." }                       (401, 403, 404, 409, ...)
        //   { "message": "...", "errors": { ... } }    (422)
        $isApi = fn (Request $request) => $request->is('api/*') || $request->expectsJson();

        $exceptions->shouldRenderJsonWhen(
            fn (Request $request, Throwable $e) => $isApi($request)
        );

        $exceptions->render(function (AuthenticationException $e, Request $request) use ($isApi) {
            if ($isApi($request)) {
                return response()->json(['message' => 'Unauthenticated.'], 401);
            }
        });

        $exceptions->render(function (ValidationException $e, Request $request) use ($isApi) {
            if ($isApi($request)) {
                return response()->json([
                    'message' => $e->getMessage(),
                    'errors' => $e->errors(),
                ], 422);
            }
        });

        // Cobre 403 (AccessDeniedHttpException e AuthorizationException),
        // 404 (rota ou model inexistente), 409 (transição de status inválida) etc.
        $exceptions->render(function (HttpExceptionInterface $e, Request $request) use ($isApi) {
            if (!$isApi($request)) {
                return null;
            }

            $status = $e->getStatusCode();

            $message = match (true) {
                // Não vaza o nome do model ("No query results for model ...").
                $status === 404 => 'Resource not found.',
                $status === 403 && ($e->getMessage() === '' || $e->getMessage() === 'This action is unauthorized.') => 'Forbidden.',
                $e->getMessage() !== '' => $e->getMessage(),
                default => 'Error.',
            };

            return response()->json(['message' => $message], $status, $e->getHeaders());
        });
    })->create();
