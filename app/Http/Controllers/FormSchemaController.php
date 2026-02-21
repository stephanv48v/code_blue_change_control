<?php

namespace App\Http\Controllers;

use App\Models\FormSchema;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FormSchemaController extends Controller
{
    public function index(): Response
    {
        $schemas = FormSchema::with('creator')
            ->orderBy('name')
            ->paginate(10);

        return Inertia::render('FormBuilder/Index', [
            'schemas' => $schemas,
        ]);
    }

    public function create(): Response
    {
        $templates = FormSchema::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'slug', 'description', 'schema']);

        return Inertia::render('FormBuilder/Create', [
            'templates' => $templates,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'schema' => ['required', 'array'],
        ]);

        $validated['created_by'] = $request->user()->id;

        $schema = FormSchema::create($validated);

        return redirect()->route('form-builder.show', $schema)
            ->with('message', 'Form schema created successfully.');
    }

    public function show(FormSchema $formSchema): Response
    {
        $formSchema->load('creator');

        return Inertia::render('FormBuilder/Show', [
            'schema' => $formSchema,
        ]);
    }

    public function edit(FormSchema $formSchema): Response
    {
        return Inertia::render('FormBuilder/Edit', [
            'schema' => $formSchema,
        ]);
    }

    public function update(Request $request, FormSchema $formSchema)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'schema' => ['required', 'array'],
        ]);

        $formSchema->update($validated);
        $formSchema->incrementVersion();

        return redirect()->route('form-builder.show', $formSchema)
            ->with('message', 'Form schema updated successfully.');
    }

    public function destroy(FormSchema $formSchema)
    {
        $formSchema->delete();

        return redirect()->route('form-builder.index')
            ->with('message', 'Form schema deleted successfully.');
    }
}
