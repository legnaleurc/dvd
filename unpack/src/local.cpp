#include <iostream>
#include <memory>
#include <sstream>

#include <archive.h>
#include <archive_entry.h>


using ArchiveHandle = std::shared_ptr<struct archive>;


class ArchiveError : public std::exception {
public:
    ArchiveError (ArchiveHandle handle, const std::string & name) noexcept
        : std::exception()
        , msg()
    {
        std::ostringstream sout;
        const char * msg = archive_error_string(handle.get());
        if (!msg) {
            msg = "(empty error message)";
        }
        sout << name << ": " << msg;
        this->msg = sout.str();
    }

    const char * what () const noexcept override {
        return this->msg.c_str();
    }

private:
    std::string msg;
};


class EntryError : public std::exception {
public:
    EntryError (const std::string & name, const std::string & detail) noexcept
        : std::exception()
        , msg()
    {
        std::ostringstream sout;
        sout << name << ": " << detail;
        this->msg = sout.str();
    }

    const char * what () const noexcept override {
        return this->msg.c_str();
    }

private:
    std::string msg;
};


ArchiveHandle createReader (const char * filePath) {
    int rv = 0;
    ArchiveHandle handle(
        archive_read_new(),
        [](ArchiveHandle::element_type * p) -> void {
            archive_read_free(p);
        }
    );

    rv = archive_read_support_filter_all(handle.get());
    if (rv != ARCHIVE_OK) {
        throw ArchiveError(handle, "archive_read_support_filter_all");
    }
    rv = archive_read_support_format_all(handle.get());
    if (rv != ARCHIVE_OK) {
        throw ArchiveError(handle, "archive_read_support_format_all");
    }

    rv = archive_read_open_filename(handle.get(), filePath, 65536);
    if (rv != ARCHIVE_OK) {
        throw ArchiveError(handle, "archive_read_open_filename");
    }

    return handle;
}


void extractArchive (ArchiveHandle reader) {
    for (;;) {
        int rv = 0;
        const void * chunk = nullptr;
        size_t length = 0;
        la_int64_t offset = 0;

        rv = archive_read_data_block(reader.get(), &chunk, &length, &offset);
        if (rv == ARCHIVE_EOF) {
            break;
        }
        if (rv != ARCHIVE_OK) {
            throw ArchiveError(reader, "archive_read_data_block");
        }

        std::cout << "readed " << length << std::endl;
    }
}


int main (int argc, char* argv[]) {
    if (argc != 2) {
        return 1;
    }

    // libarchive/libarchive#587
#ifndef _WIN32
    setlocale(LC_ALL, "");
#endif

    auto reader = createReader(argv[1]);

    while (true) {
        struct archive_entry * entry = nullptr;
        int rv = archive_read_next_header(reader.get(), &entry);
        if (rv == ARCHIVE_EOF) {
            break;
        }
        if (rv != ARCHIVE_OK) {
            throw ArchiveError(reader, "archive_read_next_header");
        }

        const char * entryName = archive_entry_pathname(entry);
        if (!entryName) {
            throw new EntryError("archive_entry_pathname", "nullptr");
        }

        std::cout << entryName << std::endl;

        extractArchive(reader);
    }

    return 0;
}
