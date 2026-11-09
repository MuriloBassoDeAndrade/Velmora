<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\CartService;

class CartController extends Controller
{
    public function __construct(
        protected CartService $cartService
    ) {}
}