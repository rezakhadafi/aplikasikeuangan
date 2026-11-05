<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Contact;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContactController extends Controller
{
    /**
     * List contacts.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Contact::query();

        if ($request->filled('type')) {
            $query->where('type', $request->query('type'));
        }

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->query('search') . '%');
        }

        $contacts = $query->orderBy('name')->get();

        return response()->json(['data' => $contacts]);
    }

    /**
     * Store new contact.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['required', 'in:customer,supplier'],
            'name' => ['required', 'string', 'max:120'],
            'phone' => ['nullable', 'string', 'max:20'],
        ]);

        $contact = Contact::create($validated);

        return response()->json([
            'message' => 'Kontak berhasil ditambahkan.',
            'data' => $contact,
        ], 201);
    }

    /**
     * Update contact.
     */
    public function update(Request $request, Contact $contact): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['sometimes', 'required', 'in:customer,supplier'],
            'name' => ['sometimes', 'required', 'string', 'max:120'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:20'],
        ]);

        $contact->update($validated);

        return response()->json([
            'message' => 'Kontak berhasil diperbarui.',
            'data' => $contact,
        ]);
    }

    /**
     * Delete contact.
     */
    public function destroy(Contact $contact): JsonResponse
    {
        $contact->delete();

        return response()->json(['message' => 'Kontak berhasil dihapus.']);
    }
}

